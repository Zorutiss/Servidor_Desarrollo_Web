import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  number: String,
  postal: String,
  city: String,
  province: String,
}, { _id: false });

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: addressSchema,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// CIF único por compañía
clientSchema.index({ cif: 1, company: 1 }, { unique: true });

export default mongoose.model('Client', clientSchema);
