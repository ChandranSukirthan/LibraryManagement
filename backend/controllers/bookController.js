import Book from "../models/Book.js";

/*
Convert uploaded file buffer from multer
to a base64 Data URI string for direct MongoDB storage
*/
const bufferToDataUri = (file) => {
    const base64Data = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64Data}`;
};

/*
Escape spacial Regular Expression characters
before filtering book by author
*/

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

//Create Book
//Post /api/books

export const createBook = async (req, res) => {
    try {
        // Handle raw JSON array `[{...}]` or object `{...}`
        const bodyData = Array.isArray(req.body) ? req.body[0] : (req.body || {});

        const title = bodyData.title;
        const author = bodyData.author;
        const genre = bodyData.genre;
        const yearPublished = bodyData.yearPublished;

        // Check required text fields
        if (!title?.trim() || !author?.trim() || !genre?.trim() || yearPublished === undefined || yearPublished === null || String(yearPublished).trim() === "") {
            return res.status(400).json({
                message: "All book fields are required",
            });
        }

        let coverImageData = null;

        // Option A: Image uploaded via form-data file
        if (req.file) {
            coverImageData = {
                url: bufferToDataUri(req.file),
                contentType: req.file.mimetype,
            };
        } 
        // Option B: Image URL provided in raw JSON
        else if (bodyData.coverImage?.url || bodyData.coverUrl || typeof bodyData.cover === "string") {
            coverImageData = {
                url: bodyData.coverImage?.url || bodyData.coverUrl || bodyData.cover,
                publicId: bodyData.coverImage?.publicId || bodyData.coverImage?.public_id || "external_url",
            };
        } 
        else {
            return res.status(400).json({
                message: "Book cover Image is required"
            });
        }

        // Save book in MongoDB
        const book = await Book.create({
            title: title.trim(),
            author: author.trim(),
            genre: genre.trim(),
            yearPublished: Number(yearPublished),
            coverImage: coverImageData,
        });

        res.status(201).json({
            message: "Book created successfully",
            book,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

//Read All Book
//Get /api/books

export const getBooks = async (req,res) => {
    try{
        const {author} = req.query;

        let filter = {};

        //Bonus feature - filter books by author
        if(author) {
            filter.author = {
                $regex: escapeRegex(author),
                $options: "i",
            };
        }

        const books = await Book.find(filter).sort ({
            createdAt: -1,
        });
        res.status(200).json(books);
    }
    catch (error){
        res.status(500).json({
            message: error.message,
        });
    }
};


//Read one Book by id
//Get /api/books/:id
export const getBookById = async(req,res) =>{
    try{
        const book = await Book.findById(req.params.id);

        if(!book) {
            return res.status(404).json({
                message: "Book not found",
            });
        }

        res.status(200).json(book);
    }
    catch(error){
        res.status(500).json({
            message: error.message,
        });
    }
};

//Update Book
//Put /api/book/:id
export const updateBook = async (req,res) =>{
    try{
        const book = await Book.findById(req.params.id);

        if(!book){
            return res.status(404).json({
                message: "Book not found"
            });
        }

        /*
        Convert new uploaded image buffer if user uploads a file
        */
        if(req.file) {
            book.coverImage = {
                url: bufferToDataUri(req.file),
                contentType: req.file.mimetype,
            };
        } else if (req.body.coverImage?.url || req.body.coverUrl || typeof req.body.cover === "string") {
            book.coverImage = {
                url: req.body.coverImage?.url || req.body.coverUrl || req.body.cover,
                publicId: req.body.coverImage?.publicId || req.body.coverImage?.public_id || "external_url",
            };
        }

        //Update Book text fields
        book.title = req.body.title ?? book.title;
        book.author = req.body.author ?? book.author;
        book.genre = req.body.genre ?? book.genre;
        if (req.body.yearPublished !== undefined && req.body.yearPublished !== "") {
            book.yearPublished = Number(req.body.yearPublished);
        }

        //save updated book
        const updatedBook = await book.save();

        res.status(200).json({
            message: "Book updated successfully",
            book: updatedBook,
        });

    }
    catch (error){
        res.status(500).json({
            message: error.message,
        });
    }
};


// 5. Delete Book (DELETE /api/books/:id)
export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                message: "Book not found",
            });
        }

        // Always delete book document from MongoDB
        await book.deleteOne();

        res.status(200).json({
            message: "Book deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};