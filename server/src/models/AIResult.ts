import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const AIResultSchema = new Schema(
  {
    incident_id: { type: Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    type: { type: String, required: true, enum: ['summary', 'next_actions'] },
    result_text: { type: String, required: true },
  },
  { timestamps: true },
)

AIResultSchema.set('toJSON', {
  transform: (_doc: unknown, ret: any) => {
    ret._id = ret._id.toString()
    ret.incident_id = ret.incident_id.toString()
    delete ret.__v
    return ret
  },
})


export type AIResultDoc = InferSchemaType<typeof AIResultSchema> & {
  _id: string
  incident_id: string
  created_at: string
}

export const AIResult = mongoose.model('AIResult', AIResultSchema)

