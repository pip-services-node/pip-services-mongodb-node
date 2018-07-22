"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
class MongoDbConnectionResolver {
    constructor() {
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
        this._credentialResolver = new pip_services_components_node_2.CredentialResolver();
    }
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    validateConnection(correlationId, connection) {
        let uri = connection.getUri();
        if (uri != null)
            return null;
        let host = connection.getHost();
        if (host == null)
            return new pip_services_commons_node_2.ConfigException(correlationId, "NO_HOST", "Connection host is not set");
        let port = connection.getPort();
        if (port == 0)
            return new pip_services_commons_node_2.ConfigException(correlationId, "NO_PORT", "Connection port is not set");
        let database = connection.getAsNullableString("database");
        if (database == null)
            return new pip_services_commons_node_2.ConfigException(correlationId, "NO_DATABASE", "Connection database is not set");
        return null;
    }
    validateConnections(correlationId, connections) {
        if (connections == null || connections.length == 0)
            return new pip_services_commons_node_2.ConfigException(correlationId, "NO_CONNECTION", "Database connection is not set");
        for (let connection of connections) {
            let error = this.validateConnection(correlationId, connection);
            if (error)
                return error;
        }
        return null;
    }
    composeUri(connections, credential) {
        // If there is a uri then return it immediately
        for (let connection of connections) {
            let uri = connection.getUri();
            if (uri)
                return uri;
        }
        // Define hosts
        let hosts = '';
        for (let connection of connections) {
            let host = connection.getHost();
            let port = connection.getPort();
            if (hosts.length > 0)
                hosts += ',';
            hosts += host + (port == null ? '' : ':' + port);
        }
        // Define database
        let database = '';
        for (let connection of connections) {
            database = database || connection.getAsNullableString("database");
        }
        if (database.length > 0)
            database = '/' + database;
        // Define authentication part
        let auth = '';
        if (credential) {
            let username = credential.getUsername();
            if (username) {
                let password = credential.getPassword();
                if (password)
                    auth = username + ':' + password + '@';
                else
                    auth = username + '@';
            }
        }
        // Define additional parameters parameters
        let options = pip_services_commons_node_1.ConfigParams.mergeConfigs(...connections).override(credential);
        options.remove('host');
        options.remove('port');
        options.remove('database');
        options.remove('username');
        options.remove('password');
        let params = '';
        let keys = options.getKeys();
        for (let key of keys) {
            if (params.length > 0)
                params += '&';
            params += key;
            let value = options.getAsString(key);
            if (value != null)
                params += '=' + value;
        }
        if (params.length > 0)
            params = '?' + params;
        // Compose uri
        let uri = "mongodb://" + auth + hosts + database + params;
        return uri;
    }
    resolve(correlationId, callback) {
        let connections;
        let credential;
        async.parallel([
            (callback) => {
                this._connectionResolver.resolveAll(correlationId, (err, result) => {
                    connections = result;
                    // Validate connections
                    if (err == null)
                        err = this.validateConnections(correlationId, connections);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err, result) => {
                    credential = result;
                    // Credentials are not validated right now
                    callback(err);
                });
            }
        ], (err) => {
            if (err)
                callback(err, null);
            else {
                let uri = this.composeUri(connections, credential);
                callback(null, uri);
            }
        });
    }
}
exports.MongoDbConnectionResolver = MongoDbConnectionResolver;
//# sourceMappingURL=MongoDbConnectionResolver.js.map