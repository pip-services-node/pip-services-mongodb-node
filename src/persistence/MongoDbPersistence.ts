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

    protected _logger: CompositeLogger = new CompositeLogger();
    protected _connectionResolver: MongoDbConnectionResolver = new MongoDbConnectionResolver();
    protected _options: ConfigParams = new ConfigParams();

    protected _connection: any;
    protected _database: string;
    protected _collection: string;
    protected _model: any;
    protected _schema: Schema;

    public constructor(collection?: string, schema?: Schema) {
        this._connection = createConnection();
        this._collection = collection;
        this._schema = schema;
        
        if (collection != null && schema != null) {
            schema.set('collection', collection);
            this._model = this._connection.model(collection, schema);
        }
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
    }

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

    // Convert object to JSON format
    protected convertToPublic(value: any): any {
        if (value && value.toJSON)
            value = value.toJSON();
        return value;
    }    

    // Convert object from public format
    protected convertFromPublic(value: any): any {
        return value;
    }    

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

    public close(correlationId: string, callback?: (err: any) => void): void {
        this._connection.close((err) => {
            if (err)
                err = new ConnectionException(correlationId, 'DISCONNECT_FAILED', 'Disconnect from mongodb failed: ') .withCause(err);
            else
                this._logger.debug(correlationId, "Disconnected from mongodb database %s", this._database);

            if (callback) callback(err);
        });
    }

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
