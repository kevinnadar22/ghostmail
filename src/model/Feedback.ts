import mongoose, { Document, Model, Schema, model } from "mongoose";

export interface IFeedback extends Document {
    ipAddress: string;
    email?: string;
    message: string;
    createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
    ipAddress: {
        type: String,
        required: [true, "IP address is required"],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address",
        ],
    },
    message: {
        type: String,
        required: [true, "Feedback message is required"],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const FeedbackModel =
    (mongoose.models.Feedback as Model<IFeedback>) ||
    model<IFeedback>("Feedback", feedbackSchema);

export default FeedbackModel;