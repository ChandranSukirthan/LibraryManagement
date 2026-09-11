import mongoose from "mongoose";

// Define the structure of a Book document
const bookSchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: [true, "Book title is required"],
            trim: true,
        },

        author: {
            type: String,
            required: [true, "Author is required"],
            trim: true,
        },

        genre: {
            type: String,
            required: [true,"Genre is required"],
            trim: true,
        },

        yearPublished: {
            type: Number,
            required: [true, "Published year is required"],
            min: 0,
        },

        // MongoDB image storage information
        coverImage: {
            url: {
                type: String,
                required: true,
            },
            contentType: {
                type: String,
            },
            publicId: {
                type: String,
            },
        },
    },
    {
        timestamps: true,
    }
);
const Book = mongoose.model("Book", bookSchema);
export default Book;