import { Schema } from "mongoose";
import { ConfigParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';
import { DataPage } from 'pip-services-commons-node';
import { AnyValueMap } from 'pip-services-commons-node';
import { IIdentifiable } from 'pip-services-commons-node';
import { IWriter } from 'pip-services-data-node';
import { IGetter } from 'pip-services-data-node';
import { ISetter } from 'pip-services-data-node';
import { MongoDbPersistence } from './MongoDbPersistence';
/**
 * Contains method for working with a MongoDB collection that contains items of type T,
 * [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/data.iidentifiable.html identifiable]]
 * by their keys of type K.
 *
 * ### Configuration parameters ###
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
 * - __options__
 *     - "options.max_pool_size" (default is 2);
 *     - "options.keep_alive" (default is 1);
 *     - "options.connect_timeout" (default is 5000);
 *     - "options.auto_reconnect" (default is <code>true</code>);
 *     - "options.max_page_size" (default is 100);
 *     - "options.debug" (default is <code>false</code>).
 * - "collection" - the MongoDB collection to work with.
 *
 * ### References ###
 *
 * A logger and a connection resolver can be referenced by passing the following references
 * to the object's [[setReferences]] method:
 *
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver),
 * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code> (for the connection resolver's credential resolver)
 *
 * ### Examples ###
 * Example IdentifiableMongoDbPersistence implementation:
 *
 *     export class MyDataMongoDbPersistence
 *       extends IdentifiableMongoDbPersistence<MyDataV1, string> {
 *
 *       constructor() {
 *           super('mydata', MyDataMongoDbSchema());
 *           this._maxPageSize = 1000;
 *       }
 *
 *       private composeFilter(filter: FilterParams): any {
 *           filter = filter || new FilterParams();
 *           let criteria = [];
 *           let udi = filter.getAsNullableString('udi');
 *           if (udi != null) {
 *               criteria.push({ udi: udi });
 *           }
 *           let udis = filter.getAsObject('udis');
 *           if (_.isString(udis))
 *               udis = udis.split(',');
 *           if (_.isArray(udis))
 *               criteria.push({ udi: { $in: udis } });
 *           return criteria.length > 0 ? { $and: criteria } : null;
 *       }
 *
 *       public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
 *           callback: (err: any, page: DataPage<MyDataV1>) => void): void {
 *           super.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
 *       }
 *
 *       public getOneByUdi(correlationId: string, udi: string,
 *           callback: (err: any, item: MyDataV1) => void): void {
 *           let criteria = {
 *               udi: udi
 *           };
 *           this._model.findOne(criteria, (err, item) => {
 *               item = this.convertFromPublic(item);
 *               if (item != null) this._logger.trace(correlationId, "Found my data by %s", udi);
 *               else this._logger.trace(correlationId, "Cannot find my data by %s", udi);
 *               callback(err, item);
 *           });
 *       }
 *
 *       //other methods that are specific to working with MyDataV1 objects.
 *
 *     }
 *
 *
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/data.iidentifiable.html IIdentifiable]] (in the PipServices "Commons" package)
 */
export declare class IdentifiableMongoDbPersistence<T extends IIdentifiable<K>, K> extends MongoDbPersistence implements IWriter<T, K>, IGetter<T, K>, ISetter<T> {
    protected _maxPageSize: number;
    /**
     * Creates a new IdentifiableMongoDbPersistence object and initializes it
     * using the given collection name and schema.
     *
     * @param collection    the name of the collection to work with. Cannot be null.
     * @param schema        the schema to use for document verification. Cannot be null.
     *
     * @throws an Error if the collection or schema are <code>null</code>.
     */
    constructor(collection: string, schema: Schema);
    /**
     * Configures this IdentifiableMongoDbPersistence using the given configuration parameters.
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
     * - "collection" - the MongoDB collection to work with.
     *
     * @param config    the configuration parameters to configure this IdentifiableMongoDbPersistence with.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    configure(config: ConfigParams): void;
    /**
     * Converts the given object from the public partial format.
     *
     * @param value     the object to convert from the public partial format.
     * @returns the initial object.
     */
    protected convertFromPublicPartial(value: any): any;
    /**
     * Retrieves DataPages in accordance with the given parameters.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the function to use for filtering results.
     * @param paging            the paging parameters to use.
     * @param sort              the function to use for sorting results.
     * @param select            the function to select results by.
     * @param callback          the function to call with the retrieved pages
     *                          (or with an error, if one is raised).
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.datapage.html DataPage]] (in the PipServices "Commons" package)
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.pagingparams.html PagingParams]] (in the PipServices "Commons" package)
     */
    protected getPageByFilter(correlationId: string, filter: any, paging: PagingParams, sort: any, select: any, callback: (err: any, items: DataPage<T>) => void): void;
    /**
     * Retrieves a list of items in accordance with the given parameters.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the function to use for filtering results.
     * @param sort              the function to use for sorting results.
     * @param select            the function to select results by.
     * @param callback          the function to call with the retrieved list of items
     *                          (or with an error, if one is raised).
     */
    protected getListByFilter(correlationId: string, filter: any, sort: any, select: any, callback: (err: any, items: T[]) => void): void;
    /**
     * Retrieves the items with the given IDs.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param ids               the ids of the items to retrieve.
     * @param callback          the function to call with the retrieved list of items
     *                          (or with an error, if one is raised).
     */
    getListByIds(correlationId: string, ids: K[], callback: (err: any, items: T[]) => void): void;
    /**
     * Retrieves an item by its ID.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param id                the id of the item to retrieve.
     * @param callback          the function to call with the retrieved item
     *                          (or with an error, if one is raised).
     */
    getOneById(correlationId: string, id: K, callback: (err: any, item: T) => void): void;
    /**
     * Retrieves a random item from the ones that are stored.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the filtering function to filter the result by.
     * @param callback          the function to call with the randomly retrieved item
     *                          (or with an error, if one is raised).
     */
    protected getOneRandom(correlationId: string, filter: any, callback: (err: any, item: T) => void): void;
    /**
     * Creates a record of the given item in the database.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param item              the item to create a record of.
     * @param callback          (optional) the function to call with the created record
     *                          (or with an error, if one is raised).
     *
     * @see [[save]]
     */
    create(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Upserts the given item in the database.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param item              the item to upsert.
     * @param callback          (optional) the function to call with the item that was upserted
     *                          (or with an error, if one is raised).
     */
    set(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Updates the record of the given item.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param item              the item to update.
     * @param callback          (optional) the function to call with the updated item
     *                          (or with an error, if one is raised).
     */
    update(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Performes a partial update for the record with the given ID.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param id                the id of the item that is to be updated (partially).
     * @param data              the map of items to update in the record.
     * @param callback          (optional) the function to call with the updated item
     *                          (or with an error, if one is raised).
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.anyvaluemap.html AnyValueMap]]
     */
    updatePartially(correlationId: string, id: K, data: AnyValueMap, callback?: (err: any, item: T) => void): void;
    /**
     * Deletes the item with the given ID.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param id                the id of the item that is to be deleted.
     * @param callback          (optional) the function to call with the deleted item
     *                          (or with an error, if one is raised).
     */
    deleteById(correlationId: string, id: K, callback?: (err: any, item: T) => void): void;
    /**
     * Deletes the items that match the given filter.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the filter to use for determining what items to delete.
     * @param callback          (optional) the function to call once the items have been deleted
     *                          (or with an error, if one is raised).
     */
    deleteByFilter(correlationId: string, filter: any, callback?: (err: any) => void): void;
    /**
     * Deletes the items with the given IDs.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param ids               the ids of the items that are to be deleted.
     * @param callback          (optional) the function to call once the items have been deleted
     *                          (or with an error, if one is raised).
     */
    deleteByIds(correlationId: string, ids: K[], callback?: (err: any) => void): void;
}
