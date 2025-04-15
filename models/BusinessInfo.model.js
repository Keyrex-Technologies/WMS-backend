import mongoose from 'mongoose';
const { Schema } = mongoose;

const BusinessInfoSchema = new Schema({
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    // fiscalYearStart: {
    //     type: Date,
    //     required: [true, 'Fiscal year start date is required'],
    //     validate: {
    //         validator: function (v) {
    //             return v instanceof Date && !isNaN(v);
    //         },
    //         message: props => `${props.value} is not a valid date!`
    //     }
    // },
    businessAddress: {
        type: String,
        required: [true, 'Business address is required'],
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    // currency: {
    //     type: String,
    //     required: [true, 'Currency is required'],
    //     trim: true,
    //     uppercase: true,
    //     enum: {
    //         values: ['PKR', 'USD', 'EUR', 'GBP', 'AED'],
    //         message: '{VALUE} is not a supported currency'
    //     }
    // },
    // timezone: {
    //     type: String,
    //     required: [true, 'Timezone is required'],
    //     trim: true,
    //     validate: {
    //         validator: function (v) {
    //             try {
    //                 Intl.DateTimeFormat(undefined, { timeZone: v });
    //                 return true;
    //             } catch (ex) {
    //                 return false;
    //             }
    //         },
    //         message: props => `${props.value} is not a valid timezone`
    //     }
    // },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
BusinessInfoSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

BusinessInfoSchema.index({ businessName: 1 }, { unique: true });

BusinessInfoSchema.methods.toJSON = function () {
    const obj = this.toObject();
    // Remove internal fields from the response
    delete obj.__v;
    return obj;
};

export default mongoose.model('BusinessInfo', BusinessInfoSchema);