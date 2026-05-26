import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const IncidentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    status: { type: String, required: true, enum: ['Open', 'Investigating', 'Resolved'], default: 'Open' },
    reporter_name: { type: String, required: true, trim: true },
    latest_update: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

IncidentSchema.set('toJSON', {
  transform: (_doc: unknown, ret: any) => {
    ret._id = ret._id.toString()
    delete ret.__v
    return ret
  },
})


export type IncidentDoc = InferSchemaType<typeof IncidentSchema> & {
  _id: string
  created_at: string
  updated_at: string
}

export const Incident = mongoose.model('Incident', IncidentSchema)

