let _ = require('lodash');
let async = require('async');

import { Schema } from "mongoose";

import { ConfigParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';
import { DataPage } from 'pip-services-commons-node';
import { AnyValueMap } from 'pip-services-commons-node';
import { IIdentifiable } from 'pip-services-commons-node';
import { IdGenerator } from 'pip-services-commons-node';

import { IWriter } from 'pip-services-data-node';
import { IGetter } from 'pip-services-data-node';
import { ISetter } from 'pip-services-data-node';

import { MongoDbPersistence } from './MongoDbPersistence';

export class IdentifiableMongoDbPersistence<T extends IIdentifiable<K>, K> extends MongoDbPersistence
    implements IWriter<T, K>, IGetter<T, K>, ISetter<T> {
    protected _maxPageSize: number = 100;

    public constructor(collection: string, schema: Schema) {
        super(collection, schema);

        if (collection == null)
            throw new Error("Collection name could not be null");
        if (schema == null)
            throw new Error("Schema could not be null");
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }

    // Convert object from public partial format
    protected convertFromPublicPartial(value: any): any {
        return this.convertFromPublic(value);
    }    
    
    protected getPageByFilter(correlationId: string, filter: any, paging: PagingParams, 
        sort: any, select: any, callback: (err: any, items: DataPage<T>) => void): void {
        // Adjust max item count based on configuration
        paging = paging || new PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);
        let pagingEnabled = paging.total;

        // Configure statement
        let statement = this._model.find(filter);

        if (skip >= 0) statement.skip(skip);
        statement.limit(take);
        if (sort && !_.isEmpty(sort)) statement.sort(sort);
        if (select && !_.isEmpty(select)) statement.select(select);

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
                        
                    let page = new DataPage<T>(items, count);
                    callback(null, page);
                });
            } else {
                let page = new DataPage<T>(items);
                callback(null, page);
            }
        });
    }

    protected getListByFilter(correlationId: string, filter: any, sort: any, select: any, 
        callback: (err: any, items: T[]) => void): void {
        
        // Configure statement
        let statement = this._model.find(filter);

        if (sort && !_.isEmpty(sort)) statement.sort(sort);
        if (select && !_.isEmpty(select)) statement.select(select);

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

    public getListByIds(correlationId: string, ids: K[],
        callback: (err: any, items: T[]) => void): void {
        let filter = {
            _id: { $in: ids }
        }
        this.getListByFilter(correlationId, filter, null, null, callback);
    }

    public getOneById(correlationId: string, id: K, callback: (err: any, item: T) => void): void {
        this._model.findById(id, (err, item) => {
            if (!err)
                this._logger.trace(correlationId, "Retrieved from %s by id = %s", this._collection, id);

            item = this.convertToPublic(item);
            callback(err, item);
        });
    }

    protected getOneRandom(correlationId: string, filter: any, callback: (err: any, item: T) => void): void {
        this._model.count(filter, (err, count) => {
            if (err) {
                callback(err, null);
                return;
            }

            let pos = _.random(0, count - 1);

            this._model.find(filter)
                (pos >= 0 ? pos : 0)
                .limit(1)
                .exec((err, items) => {
                    let item = (items != null && items.length > 0) ? items[0] : null;
                    
                    item = this.convertToPublic(item);
                    callback(err, item);
                });
        });
    }

    public create(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null) {
            callback(null, null);
            return;
        }

        // Assign unique id
        let newItem: any = _.omit(item, 'id');
        newItem._id = item.id || IdGenerator.nextLong();
        newItem = this.convertFromPublic(newItem);

        this._model.create(newItem, (err, newItem) => {
            if (!err)
                this._logger.trace(correlationId, "Created in %s with id = %s", this._collection, newItem._id);

            newItem = this.convertToPublic(newItem);
            callback(err, newItem);
        });
    }

    public set(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null) {
            if (callback) callback(null, null);
            return;
        }

        // Assign unique id
        let newItem: any = _.omit(item, 'id');
        newItem._id = item.id || IdGenerator.nextLong();
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

    public update(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null || item.id == null) {
            if (callback) callback(null, null);
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

    public updatePartially(correlationId: string, id: K, data: AnyValueMap,
        callback?: (err: any, item: T) => void): void {
            
        if (data == null || id == null) {
            if (callback) callback(null, null);
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

    public deleteById(correlationId: string, id: K, callback?: (err: any, item: T) => void): void {
        this._model.findByIdAndRemove(id, (err, oldItem) => {
            if (!err)
                this._logger.trace(correlationId, "Deleted from %s with id = %s", this._collection, id);

            if (callback) {
                oldItem = this.convertToPublic(oldItem);
                callback(err, oldItem);
            }
        });
    }

    public deleteByFilter(correlationId: string, filter: any, callback?: (err: any) => void): void {
        this._model.remove(filter, (err, count) => {
            if (!err)
                this._logger.trace(correlationId, "Deleted %d items from %s", count, this._collection);

            if (callback) callback(err);
        });
    }

    public deleteByIds(correlationId: string, ids: K[], callback?: (err: any) => void): void {
        let filter = {
            _id: { $in: ids }
        }
        this.deleteByFilter(correlationId, filter, callback);
    }
}
