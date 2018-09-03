"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module persistence */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let async = require('async');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const MongoDbPersistence_1 = require("./MongoDbPersistence");
//TODO (in method comments): Which is better or more correct - "record" or "document"?
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
 *
 * Example implementation of the IdentifiableMongoDbPersistence interface:
 *
 *     export class MyDataMongoDbPersistence
 *       extends IdentifiableMongoDbPersistence<MyDataV1, string> {
 *
 *         constructor() {
 *             super('mydata', MyDataMongoDbSchema());
 *             this._maxPageSize = 1000;
 *         }
 *
 *         private composeFilter(filter: FilterParams): any {
 *             filter = filter || new FilterParams();
 *             let criteria = [];
 *             let udi = filter.getAsNullableString('udi');
 *             if (udi != null) {
 *                 criteria.push({ udi: udi });
 *             }
 *             let udis = filter.getAsObject('udis');
 *             if (_.isString(udis))
 *                 udis = udis.split(',');
 *             if (_.isArray(udis))
 *                 criteria.push({ udi: { $in: udis } });
 *             return criteria.length > 0 ? { $and: criteria } : null;
 *         }
 *
 *         public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
 *             callback: (err: any, page: DataPage<MyDataV1>) => void): void {
 *             super.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
 *         }
 *
 *         public getOneByUdi(correlationId: string, udi: string,
 *             callback: (err: any, item: MyDataV1) => void): void {
 *             let criteria = {
 *                 udi: udi
 *             };
 *             this._model.findOne(criteria, (err, item) => {
 *                 item = this.convertFromPublic(item);
 *                 if (item != null) this._logger.trace(correlationId, "Found my data by %s", udi);
 *                 else this._logger.trace(correlationId, "Cannot find my data by %s", udi);
 *                 callback(err, item);
 *             });
 *         }
 *
 *         //other methods that are specific to working with MyDataV1 objects.
 *
 *     }
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/data.iidentifiable.html IIdentifiable]] (in the PipServices "Commons" package)
 */
class IdentifiableMongoDbPersistence extends MongoDbPersistence_1.MongoDbPersistence {
    /**
     * Creates a new IdentifiableMongoDbPersistence object and initializes it
     * using the given collection name and schema.
     *
     * @param collection    the name of the collection to work with. Cannot be null.
     * @param schema        the schema to use for document verification. Cannot be null.
     *
     * @throws an Error if the collection or schema are <code>null</code>.
     */
    constructor(collection, schema) {
        super(collection, schema);
        //TODO (note for SS): is this needed? It's in MongoDbPersistence as well...
        this._maxPageSize = 100;
        if (collection == null)
            throw new Error("Collection name could not be null");
        if (schema == null)
            throw new Error("Schema could not be null");
    }
    //TODO (note for SS): can be removed? _maxPageSize is already set in MongoDbPersistence.
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
    configure(config) {
        super.configure(config);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }
    /**
     * Converts the given object from the public partial format.
     *
     * @param value     the object to convert from the public partial format.
     * @returns the initial object.
     */
    convertFromPublicPartial(value) {
        return this.convertFromPublic(value);
    }
    //TODO: "filter" and "sort" - functions, queries? + is "select" correct?
    //     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.filterparams.html FilterParams]] (in the PipServices "Commons" package)
    //     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.sortparams.html SortParams]] (in the PipServices "Commons" package)
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
    getPageByFilter(correlationId, filter, paging, sort, select, callback) {
        // Adjust max item count based on configuration
        paging = paging || new pip_services_commons_node_1.PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);
        let pagingEnabled = paging.total;
        // Configure statement
        let statement = this._model.find(filter);
        if (skip >= 0)
            statement.skip(skip);
        statement.limit(take);
        if (sort && !_.isEmpty(sort))
            statement.sort(sort);
        if (select && !_.isEmpty(select))
            statement.select(select);
        statement.exec((err, items) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (items != null)
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._collection);
            items = _.map(items, this.convertToPublic);
            if (pagingEnabled) {
                this._model.count(filter, (err, count) => {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    let page = new pip_services_commons_node_2.DataPage(items, count);
                    callback(null, page);
                });
            }
            else {
                let page = new pip_services_commons_node_2.DataPage(items);
                callback(null, page);
            }
        });
    }
    //TODO: "filter" and "sort" - functions, queries? + is "select" correct?
    //     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.filterparams.html FilterParams]] (in the PipServices "Commons" package)
    //     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/data.sortparams.html SortParams]] (in the PipServices "Commons" package)
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
    getListByFilter(correlationId, filter, sort, select, callback) {
        // Configure statement
        let statement = this._model.find(filter);
        if (sort && !_.isEmpty(sort))
            statement.sort(sort);
        if (select && !_.isEmpty(select))
            statement.select(select);
        statement.exec((err, items) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (items != null)
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._collection);
            items = _.map(items, this.convertToPublic);
            callback(null, items);
        });
    }
    /**
     * Retrieves the items with the given IDs.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param ids               the ids of the items to retrieve.
     * @param callback          the function to call with the retrieved list of items
     *                          (or with an error, if one is raised).
     */
    getListByIds(correlationId, ids, callback) {
        let filter = {
            _id: { $in: ids }
        };
        this.getListByFilter(correlationId, filter, null, null, callback);
    }
    /**
     * Retrieves an item by its ID.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param id                the id of the item to retrieve.
     * @param callback          the function to call with the retrieved item
     *                          (or with an error, if one is raised).
     */
    getOneById(correlationId, id, callback) {
        this._model.findById(id, (err, item) => {
            if (!err)
                this._logger.trace(correlationId, "Retrieved from %s by id = %s", this._collection, id);
            item = this.convertToPublic(item);
            callback(err, item);
        });
    }
    //TODO: "filter" = function? Check in Data.Persistence(s) as well...
    /**
     * Retrieves a random item from the ones that are stored.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the filtering function to filter the result by.
     * @param callback          the function to call with the randomly retrieved item
     *                          (or with an error, if one is raised).
     */
    getOneRandom(correlationId, filter, callback) {
        this._model.count(filter, (err, count) => {
            if (err) {
                callback(err, null);
                return;
            }
            let pos = _.random(0, count - 1);
            this._model.find(filter)
                .skip(pos >= 0 ? pos : 0)
                .limit(1)
                .exec((err, items) => {
                let item = (items != null && items.length > 0) ? items[0] : null;
                item = this.convertToPublic(item);
                callback(err, item);
            });
        });
    }
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
    create(correlationId, item, callback) {
        if (item == null) {
            callback(null, null);
            return;
        }
        // Assign unique id
        let newItem = _.omit(item, 'id');
        newItem._id = item.id || pip_services_commons_node_3.IdGenerator.nextLong();
        newItem = this.convertFromPublic(newItem);
        this._model.create(newItem, (err, newItem) => {
            if (!err)
                this._logger.trace(correlationId, "Created in %s with id = %s", this._collection, newItem._id);
            newItem = this.convertToPublic(newItem);
            callback(err, newItem);
        });
    }
    /**
     * Upserts the given item in the database.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param item              the item to upsert.
     * @param callback          (optional) the function to call with the item that was upserted
     *                          (or with an error, if one is raised).
     */
    set(correlationId, item, callback) {
        if (item == null) {
            if (callback)
                callback(null, null);
            return;
        }
        // Assign unique id
        let newItem = _.omit(item, 'id');
        newItem._id = item.id || pip_services_commons_node_3.IdGenerator.nextLong();
        newItem = this.convertFromPublic(newItem);
        let filter = {
            _id: newItem._id
        };
        let options = {
            new: true,
            upsert: true
        };
        this._model.findOneAndUpdate(filter, newItem, options, (err, newItem) => {
            if (!err)
                this._logger.trace(correlationId, "Set in %s with id = %s", this._collection, item.id);
            if (callback) {
                newItem = this.convertToPublic(newItem);
                callback(err, newItem);
            }
        });
    }
    /**
     * Updates the record of the given item.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param item              the item to update.
     * @param callback          (optional) the function to call with the updated item
     *                          (or with an error, if one is raised).
     */
    update(correlationId, item, callback) {
        if (item == null || item.id == null) {
            if (callback)
                callback(null, null);
            return;
        }
        let newItem = _.omit(item, 'id');
        newItem = this.convertFromPublic(newItem);
        let options = {
            new: true
        };
        this._model.findByIdAndUpdate(item.id, newItem, options, (err, newItem) => {
            if (!err)
                this._logger.trace(correlationId, "Updated in %s with id = %s", this._collection, item.id);
            if (callback) {
                newItem = this.convertToPublic(newItem);
                callback(err, newItem);
            }
        });
    }
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
    updatePartially(correlationId, id, data, callback) {
        if (data == null || id == null) {
            if (callback)
                callback(null, null);
            return;
        }
        let newItem = data.getAsObject();
        newItem = this.convertFromPublicPartial(newItem);
        let setItem = {
            $set: newItem
        };
        let options = {
            new: true
        };
        this._model.findByIdAndUpdate(id, setItem, options, (err, newItem) => {
            if (!err)
                this._logger.trace(correlationId, "Updated partially in %s with id = %s", this._collection, id);
            if (callback) {
                newItem = this.convertToPublic(newItem);
                callback(err, newItem);
            }
        });
    }
    /**
     * Deletes the item with the given ID.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param id                the id of the item that is to be deleted.
     * @param callback          (optional) the function to call with the deleted item
     *                          (or with an error, if one is raised).
     */
    deleteById(correlationId, id, callback) {
        this._model.findByIdAndRemove(id, (err, oldItem) => {
            if (!err)
                this._logger.trace(correlationId, "Deleted from %s with id = %s", this._collection, id);
            if (callback) {
                oldItem = this.convertToPublic(oldItem);
                callback(err, oldItem);
            }
        });
    }
    /**
     * Deletes the items that match the given filter.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param filter            the filter to use for determining what items to delete.
     * @param callback          (optional) the function to call once the items have been deleted
     *                          (or with an error, if one is raised).
     */
    deleteByFilter(correlationId, filter, callback) {
        this._model.remove(filter, (err, count) => {
            if (!err)
                this._logger.trace(correlationId, "Deleted %d items from %s", count, this._collection);
            if (callback)
                callback(err);
        });
    }
    /**
     * Deletes the items with the given IDs.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param ids               the ids of the items that are to be deleted.
     * @param callback          (optional) the function to call once the items have been deleted
     *                          (or with an error, if one is raised).
     */
    deleteByIds(correlationId, ids, callback) {
        let filter = {
            _id: { $in: ids }
        };
        this.deleteByFilter(correlationId, filter, callback);
    }
}
exports.IdentifiableMongoDbPersistence = IdentifiableMongoDbPersistence;
//# sourceMappingURL=IdentifiableMongoDbPersistence.js.map