import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const IncidentUpdateSchema = new Schema(
  {
    incident_id: { type: Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    message: { type: String, required: true },
    author_name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

IncidentUpdateSchema.set('toJSON', {
  transform: (_doc: unknown, ret: any) => {
    ret._id = ret._id.toString()
    ret.incident_id = ret.incident_id.toString()
    delete ret.__v
    return ret
  },
})


export type IncidentUpdateDoc = InferSchemaType<typeof IncidentUpdateSchema> & {
  _id: string
  incident_id: string
  created_at: string
}

export const IncidentUpdate = mongoose.model('IncidentUpdate', IncidentUpdateSchema)

