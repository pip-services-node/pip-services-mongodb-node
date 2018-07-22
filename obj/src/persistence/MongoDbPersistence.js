"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const mongoose_1 = require("mongoose");
const MongoDbConnectionResolver_1 = require("../connect/MongoDbConnectionResolver");
class MongoDbPersistence {
    constructor(collection, schema) {
        this._defaultConfig = pip_services_commons_node_1.ConfigParams.fromTuples("collection", null, 
        // connections.*
        // credential.*
        "options.max_pool_size", 2, "options.keep_alive", 1, "options.connect_timeout", 5000, "options.auto_reconnect", true, "options.max_page_size", 100, "options.debug", true, "options.replica_set", false);
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._connectionResolver = new MongoDbConnectionResolver_1.MongoDbConnectionResolver();
        this._options = new pip_services_commons_node_1.ConfigParams();
        this._connection = mongoose_1.createConnection();
        this._collection = collection;
        this._schema = schema;
        if (collection != null && schema != null) {
            schema.set('collection', collection);
            this._model = this._connection.model(collection, schema);
        }
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
    }
    configure(config) {
        config = config.setDefaults(this._defaultConfig);
        this._connectionResolver.configure(config);
        let collection = config.getAsStringWithDefault('collection', this._collection);
        if (collection != this._collection && this._schema != null) {
            this._collection = collection;
            this._schema.set('collection', collection);
            this._model = this._model = this._connection.model(collection, this._schema);
        }
        this._options = this._options.override(config.getSection("options"));
    }
    // Convert object to JSON format
    convertToPublic(value) {
        if (value && value.toJSON)
            value = value.toJSON();
        return value;
    }
    // Convert object from public format
    convertFromPublic(value) {
        return value;
    }
    isOpened() {
        return this._connection.readyState == 1;
    }
    composeSettings() {
        let maxPoolSize = this._options.getAsNullableInteger("max_pool_size");
        let keepAlive = this._options.getAsNullableInteger("keep_alive");
        let connectTimeoutMS = this._options.getAsNullableInteger("connect_timeout");
        let autoReconnect = this._options.getAsNullableBoolean("auto_reconnect");
        let maxPageSize = this._options.getAsNullableInteger("max_page_size");
        let debug = this._options.getAsNullableBoolean("debug");
        let settings = {
            server: {
                poolSize: maxPoolSize,
                socketOptions: {
                    keepAlive: keepAlive,
                    connectTimeoutMS: connectTimeoutMS
                },
                auto_reconnect: autoReconnect,
                max_page_size: maxPageSize,
                debug: debug
            }
        };
        return settings;
    }
    open(correlationId, callback) {
        this._connectionResolver.resolve(correlationId, (err, uri) => {
            if (err) {
                if (callback)
                    callback(err);
                else
                    this._logger.error(correlationId, err, 'Failed to resolve MongoDb connection');
                return;
            }
            this._logger.debug(correlationId, "Connecting to mongodb");
            try {
                let settings = this.composeSettings();
                let replicaSet = this._options.getAsBoolean("replica_set");
                replicaSet = replicaSet || uri.indexOf("replicaSet") > 0;
                let openMethod = replicaSet ? 'openSet' : 'open';
                this._connection[openMethod](uri, settings, (err) => {
                    if (err) {
                        err = new pip_services_commons_node_2.ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed").withCause(err);
                    }
                    else {
                        this._database = this._database || this._connection.db.databaseName;
                        this._logger.debug(correlationId, "Connected to mongodb database %s, collection %s", this._database, this._collection);
                    }
                    if (callback)
                        callback(err);
                });
            }
            catch (ex) {
                let err = new pip_services_commons_node_2.ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed").withCause(ex);
                callback(err);
            }
        });
    }
    close(correlationId, callback) {
        this._connection.close((err) => {
            if (err)
                err = new pip_services_commons_node_2.ConnectionException(correlationId, 'DISCONNECT_FAILED', 'Disconnect from mongodb failed: ').withCause(err);
            else
                this._logger.debug(correlationId, "Disconnected from mongodb database %s", this._database);
            if (callback)
                callback(err);
        });
    }
    clear(correlationId, callback) {
        // Return error if collection is not set
        if (this._collection == null) {
            if (callback)
                callback(new Error('Collection name is not defined'));
            return;
        }
        // this._connection.db.dropCollection(this._collection, (err) => {
        //     if (err && (err.message != "ns not found" || err.message != "topology was destroyed"))
        //         err = null;
        //     if (err) {
        //         err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed")
        //             .withCause(err);
        //     }
        //     if (callback) callback(err);
        // });
        this._model.remove({}, (err) => {
            if (err) {
                err = new pip_services_commons_node_2.ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed")
                    .withCause(err);
            }
            if (callback)
                callback(err);
        });
    }
}
exports.MongoDbPersistence = MongoDbPersistence;
//# sourceMappingURL=MongoDbPersistence.js.map