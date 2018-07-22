import { Schema } from "mongoose";

export let DummyMongoDbSchema = function(): Schema {

    let schema: Schema = new Schema(
        {
            _id: { type: String },
            key: { type: String, required: true },
            content: { type: String, required: false }
        },
        {
            autoIndex: true
        }
    );

    schema.index({ key: 1 });

    schema.set('toJSON', {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    });

    return schema;
}