/** @module persistence */
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { ICleanable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionException } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';

import { Schema } from "mongoose";
import { createConnection } from "mongoose";

import { MongoDbConnectionResolver } from '../connect/MongoDbConnectionResolver';

/**
 * Class that provides methods for working with MongoDB servers.
 * 
 * MongoDbPersistences can be configured using the [[configure]] method, which searches for 
 * and sets:
 * - the connection resolver's connections and credentials ("connection(s)" and "credential(s)" 
 * sections);
 * - the MongoDB collection to work with ("collection" parameter);
 * - this persistence's options ("options" section):
 *     - "max_pool_size" (default is 2);
 *     - "keep_alive" (default is 1);
 *     - "connect_timeout" (default is 5000);
 *     - "auto_reconnect" (default is <code>true</code>);
 *     - "max_page_size" (default is 100);
 *     - "debug" (default is <code>false</code>).
 * 
 * A logger and a connection resolver can be referenced by passing the corresponding "logger", 
 * "discovery" (for the connection resolver), and "credential-store" (for the connection resolver's 
 * credential resolver) references to the object's [[setReferences]] method.
 * 
 * @see [[MongoDbConnectionResolver]]
 */
export class MongoDbPersistence implements IReferenceable, IConfigurable, IOpenable, ICleanable {

    private _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "collection", null,

        // connections.*
        // credential.*

        "options.max_pool_size", 2,
        "options.keep_alive", 1,
        "options.connect_timeout", 5000,
        "options.auto_reconnect", true,
        "options.max_page_size", 100,
        "options.debug", true,
        "options.replica_set", false
    );

    /** 
     * The logger that is referenced by this object.
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the PipServices "Components" package)
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /**
     * The connection resolver that is referenced by this object. 
     * Resolves MongoDB server URIs and the credentials that are to be used.
     * @see [[MongoDbConnectionResolver]]
     */
    protected _connectionResolver: MongoDbConnectionResolver = new MongoDbConnectionResolver();
    /**
     * This persistence's options. Set during [[configure configuration]].
     */
    protected _options: ConfigParams = new ConfigParams();

    /** Stores the opened MongoDB server connection(s). Used to work with models. */
    protected _connection: any;
    /** The Mongo database's name. */
    protected _database: string;
    /** The MongoDB collection to work with. */
    protected _collection: string;
    /** The connection's model. Chosen using this object's collection and schema. */
    protected _model: any;
    /** The schema to use for document verification. */
    protected _schema: Schema;

    /**
     * Creates a new MongoDbPersistence object. If a collection name and 
     * schema are given, then the MongoDbPersistence will be configured 
     * to work with the given collection and validate documents using the
     * given schema. If these parameters are omitted - they can be configured 
     * later on using the [[configure]] method. 
     * 
     * @param collection    the name of the collection to work with.
     * @param schema        the schema to use for document verification.
     */
    public constructor(collection?: string, schema?: Schema) {
        this._connection = createConnection();
        this._collection = collection;
        this._schema = schema;
        
        if (collection != null && schema != null) {
            schema.set('collection', collection);
            this._model = this._connection.model(collection, schema);
        }
    }

    /**
     * Sets references to this MongoDbPersistence's logger and its connection resolver.
     * 
     * @param references    an IReferences object, containing references to a "logger", a "discovery" service 
     *                      (for the connection resolver), and a "credential-store" (for the connection resolver's 
     *                      credential resolver).
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
    }

    /**
     * Configures this MongoDbPersistence by searching for and setting:
     * - the connection resolver's connections and credentials ("connection(s)" and "credential(s)" 
     * sections);
     * - the MongoDB collection to work with ("collection" parameter);
     * - this persistence's options ("options" section):
     *     - "max_pool_size" (default is 2);
     *     - "keep_alive" (default is 1);
     *     - "connect_timeout" (default is 5000);
     *     - "auto_reconnect" (default is <code>true</code>);
     *     - "max_page_size" (default is 100);
     *     - "debug" (default is <code>false</code>).
     * 
     * @param config    the configuration parameters to configure this MongoDbPersistence with.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    public configure(config: ConfigParams): void {
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

    /** 
     * Converts the given object to the public format (JSON). 
     * 
     * @param value     the object to convert to the public format.
     * @returns the object's public version.
     */
    protected convertToPublic(value: any): any {
        if (value && value.toJSON)
            value = value.toJSON();
        return value;
    }    

    /** 
     * Convert the given object from the public format (JSON) to its 
     * initial format. 
     * 
     * @param value     the object to convert from the public format.
     * @returns the initial object.
     */
    protected convertFromPublic(value: any): any {
        return value;
    }    

    /**
     * @returns whether or not this persistence is currently open and connected to a 
     *          MongoDB server.
     */
    public isOpen(): boolean {
        return this._connection.readyState == 1;
    }

    private composeSettings(): any {
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

    /**
     * Opens this MongoDB persistence by resolving and establishing a connection to the MongoDB server.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once a connection to the MongoDB server 
     *                          has been established. Will be called with an error if one is raised.
     */
    public open(correlationId: string, callback?: (err: any) => void): void {
        this._connectionResolver.resolve(correlationId, (err, uri) => {
            if (err) {
                if (callback) callback(err);
                else this._logger.error(correlationId, err, 'Failed to resolve MongoDb connection');
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
                        err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed").withCause(err);
                    } else {
                        this._database = this._database || this._connection.db.databaseName;
                        this._logger.debug(correlationId, "Connected to mongodb database %s, collection %s", this._database, this._collection);
                    }

                    if (callback) callback(err);
                });
            } catch (ex) {
                let err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed").withCause(ex);

                callback(err);
            }
        });
    }

    /**
     * Closes this MongoDB persistence disconnecting from the MongoDB server.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once disconnected from the MongoDB server. 
     *                          Will be called with an error if one is raised.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
        this._connection.close((err) => {
            if (err)
                err = new ConnectionException(correlationId, 'DISCONNECT_FAILED', 'Disconnect from mongodb failed: ') .withCause(err);
            else
                this._logger.debug(correlationId, "Disconnected from mongodb database %s", this._database);

            if (callback) callback(err);
        });
    }

    /**
     * Clears the collection that this MongoDB persistence is connected to.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the collection has been cleared.
     *                          Will be called with an error if one is raised.
     */
    public clear(correlationId: string, callback?: (err: any) => void): void {
        // Return error if collection is not set
        if (this._collection == null) {
            if (callback) callback(new Error('Collection name is not defined'));
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
                err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to mongodb failed")
                    .withCause(err);
            }
            
            if (callback) callback(err);
        });
    }

}
