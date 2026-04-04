import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description?: string;
  tags: string[];
  fileInfo: {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
  };
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
      sensitivity: 'safe' | 'flagged' | 'review';
      confidence: number;
      processedAt: Date;
    };
    error?: string;
  };
  uploadedBy: mongoose.Types.ObjectId;
  viewCount: number;
  metadata?: {
    duration?: number;
    resolution?: string;
    codec?: string;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    fileInfo: {
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      path: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
    },
    processing: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
      },
      result: {
        sensitivity: {
          type: String,
          enum: ['safe', 'flagged', 'review'],
        },
        confidence: Number,
        processedAt: Date,
      },
      error: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      duration: Number,
      resolution: String,
      codec: String,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for queries
videoSchema.index({ uploadedBy: 1, deletedAt: 1 });
videoSchema.index({ 'processing.status': 1 });

export const Video = mongoose.model<IVideo>('Video', videoSchema);
