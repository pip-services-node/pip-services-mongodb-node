/** @module persistence */
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IOpenable } from 'pip-services-commons-node';
import { ICleanable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { Schema } from "mongoose";
import { MongoDbConnectionResolver } from '../connect/MongoDbConnectionResolver';
/**
 * Class that provides methods for working with MongoDB servers.
 *
 * MongoDbPersistences can be configured using the [[configure]] method, which searches for
 * and sets:
 *
 * ### Configuration parameters ###
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
 * - __options__
 *     - "options.max_pool_size" (default is 2);
 *     - "options.keep_alive" (default is 1);
 *     - "options.connect_timeout" (default is 5000);
 *     - "options.auto_reconnect" (default is <code>true</code>);
 *     - "options.max_page_size" (default is 100);
 *     - "options.debug" (default is <code>false</code>).
 * - "collection" - the MongoDB collection to work with;
 *
 *
 * ### References ###
 * A logger and a connection resolver can be referenced by passing the following references
 * to the object's [[setReferences]] method:
 *
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver),
 * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code> (for the connection resolver's credential resolver)
 *
 * @see [[MongoDbConnectionResolver]]
 */
export declare class MongoDbPersistence implements IReferenceable, IConfigurable, IOpenable, ICleanable {
    private _defaultConfig;
    /**
     * The logger that is referenced by this object.
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the PipServices "Components" package)
     */
    protected _logger: CompositeLogger;
    /**
     * The connection resolver that is referenced by this object.
     * Resolves MongoDB server URIs and the credentials that are to be used.
     * @see [[MongoDbConnectionResolver]]
     */
    protected _connectionResolver: MongoDbConnectionResolver;
    /**
     * This persistence's options. Set during [[configure configuration]].
     */
    protected _options: ConfigParams;
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
    constructor(collection?: string, schema?: Schema);
    /**
     * Sets references to this MongoDbPersistence's logger and its connection resolver.
     *
     * __References:__
     * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
     * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver);
     * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code> (for the connection resolver's credential resolver).
     *
     * @param references    an IReferences object, containing references to a logger, a discovery service
     *                      (for the connection resolver), and a credential store (for the connection resolver's
     *                      credential resolver).
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    setReferences(references: IReferences): void;
    /**
     * Configures this MongoDbPersistence using the given configuration parameters.
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
     * - __options__
     *     - "options.max_pool_size" (default is 2);
     *     - "options.keep_alive" (default is 1);
     *     - "options.connect_timeout" (default is 5000);
     *     - "options.auto_reconnect" (default is <code>true</code>);
     *     - "options.max_page_size" (default is 100);
     *     - "options.debug" (default is <code>false</code>).
     * - "collection" - the MongoDB collection to work with;
     *
     * @param config    the configuration parameters to configure this MongoDbPersistence with.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    configure(config: ConfigParams): void;
    /**
     * Converts the given object to the public format (JSON).
     *
     * @param value     the object to convert to the public format.
     * @returns the object's public version.
     */
    protected convertToPublic(value: any): any;
    /**
     * Convert the given object from the public format (JSON) to its
     * initial format.
     *
     * @param value     the object to convert from the public format.
     * @returns the initial object.
     */
    protected convertFromPublic(value: any): any;
    /**
     * @returns whether or not this persistence is currently open and connected to a
     *          MongoDB server.
     */
    isOpen(): boolean;
    private composeSettings();
    /**
     * Opens this MongoDB persistence by resolving and establishing a connection to the MongoDB server.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once a connection to the MongoDB server
     *                          has been established. Will be called with an error if one is raised.
     */
    open(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Closes this MongoDB persistence disconnecting from the MongoDB server.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once disconnected from the MongoDB server.
     *                          Will be called with an error if one is raised.
     */
    close(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Clears the collection that this MongoDB persistence is connected to.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the collection has been cleared.
     *                          Will be called with an error if one is raised.
     */
    clear(correlationId: string, callback?: (err: any) => void): void;
}
