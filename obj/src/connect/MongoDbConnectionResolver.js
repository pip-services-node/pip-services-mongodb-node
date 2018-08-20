"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module connect */
/** @hidden */
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
/**
 * Helper class that resolves MongoDB server URIs, along with the authentication parameters to use for the connection.
 *
 *  ### Configuration parameters ###
 *
 * Parameters to pass to the [[configure]] method for component configuration:
 *
 * - __connection(s)__
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.uri" - the Mongo URI;
 *     - "connection.host" - the Mongo host;
 *     - "connection.port" - the Mongo port;
 *     - "connection.database" - the Mongo Database;
 * - __credential(s)__
 *     - "credential.username" - the username to use for authentication;
 *     - "credential.password" - the password;
 *     - "credential.store_key" - the key to use in the credential store;
 *     - "credential.access_id" - the access ID to use;
 *     - "credential.access_key" - the access key to use;
 *
 *
 * ### References ###
 *
 * A connection resolver and a credential resolver can be referenced by passing the following references
 * to the object's [[setReferences]] method:
 *
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>;
 * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code>.
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]] (in the PipServices "Components" package)
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/auth.credentialresolver.html CredentialResolver]] (in the PipServices "Components" package)
 */
class MongoDbConnectionResolver {
    constructor() {
        /**
         * The [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]]
         * to use for resolving connection parameters.
         */
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
        /**
         * The [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/auth.credentialresolver.html CredentialResolver]]
         * to use for resolving credential parameters.
         */
        this._credentialResolver = new pip_services_components_node_2.CredentialResolver();
    }
    /**
     * Sets references to this MongoDbConnectionResolver's connection and credential resolvers.
     *
     * __References:__
     * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>;
     * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code>.
     *
     * @param references    an IReferences object, containing references to a discovery service
     *                      (for the connection resolver) and a credential store (for the credential
     *                      resolver).
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    /**
     * Configures this MongoDbConnectionResolver using the given configuration parameters.
     *
     * __Configuration parameters:__
     * - __connection(s)__
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.uri" - the Mongo URI;
     *     - "connection.host" - the Mongo host;
     *     - "connection.port" - the Mongo port;
     *     - "connection.database" - the Mongo Database;
     * - __credential(s)__
     *     - "credential.username" - the username to use for authentication;
     *     - "credential.password" - the password;
     *     - "credential.store_key" - the key to use in the credential store;
     *     - "credential.access_id" - the access ID to use;
     *     - "credential.access_key" - the access key to use;
     *
     * @param config    the configuration parameters to configure this MongoDbConnectionResolver with.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
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
    /**
     * Resolves the MongoDB server's uri, along with the credentials to use for the connection,
     * using the referenced connection and credential resolvers.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call with the resolved uri
     *                          (or with an error, if one is raised).
     */
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