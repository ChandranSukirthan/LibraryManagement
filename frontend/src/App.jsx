import { useState, useEffect } from "react";
import "./App.css";
import {
  Alignment,
  Button,
  Card,
  Dialog,
  DialogBody,
  Elevation,
  FileInput,
  FormGroup,
  InputGroup,
  Intent,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Spinner,
} from "@blueprintjs/core";

// Backend API
const API_URL = "http://localhost:5001/api/books";

// Helper to format catch errors
function formatErrorMessage(error) {
  if (error.name === "TypeError" || error.message.includes("fetch")) {
    return "Cannot connect to backend server. Ensure server is running on http://localhost:5001";
  }
  return error.message || "An unexpected error occurred";
}

function App() {
  // Store books
  const [books, setBooks] = useState([]);

  // Form values
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    yearPublished: "",
  });

  // Selected Image
  const [cover, setCover] = useState(null);

  // Store image preview
  const [preview, setPreview] = useState("");

  // Used to clear Blueprint FileInput
  const [fileInputKey, setFileInputKey] = useState(0);

  // Book currently being edited
  const [editingId, setEditingId] = useState(null);

  // Book selected for details
  const [selectedBook, setSelectedBook] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Author filter
  const [authorFilter, setAuthorFilter] = useState("");

  // Popup state
  const [popupConfig, setPopupConfig] = useState({
    isOpen: false,
    message: "",
    intent: Intent.PRIMARY,
    title: "",
    onConfirm: null,
    showCancel: false,
    onCancel: null,
  });

  const showPopup = (title, message, intent = Intent.PRIMARY, onConfirm = null, showCancel = false, onCancel = null) => {
    setPopupConfig({ isOpen: true, title, message, intent, onConfirm, showCancel, onCancel });
  };

  const closePopup = (isConfirm = true) => {
    setPopupConfig((prev) => ({ ...prev, isOpen: false }));
    if (isConfirm && popupConfig.onConfirm) {
      popupConfig.onConfirm();
    } else if (!isConfirm && popupConfig.onCancel) {
      popupConfig.onCancel();
    }
  };

  // Load books when page opens
  useEffect(() => {
    fetchBooks();
  }, []);

  // Get All Books / Filter by Author
  async function fetchBooks(author = "") {
    try {
      setLoading(true);
      let url = API_URL;

      // Add author query when filtering
      if (author.trim()) {
        url += `?author=${encodeURIComponent(author.trim())}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load books from server");
      }
      const data = await response.json();

      setBooks(data);
    } catch (error) {
      showPopup("Error", formatErrorMessage(error), Intent.DANGER);
    } finally {
      setLoading(false);
    }
  }

  // Handle text inputs
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // Handle cover image selection
  function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Only allow images
    if (!file.type.startsWith("image/")) {
      showPopup("Error", "Please select a valid image file", Intent.DANGER);
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      showPopup("Warning", "Image must be smaller than 5 MB", Intent.WARNING);
      return;
    }

    // Remove previous temporary preview
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    // Store file
    setCover(file);

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);
  }

  // Submit form values
  async function handleSubmit(event) {
    event.preventDefault();

    // Validate fields
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.genre.trim() ||
      !formData.yearPublished
    ) {
      showPopup("Warning", "Please complete all book fields", Intent.WARNING);
      return;
    }

    // Image required when creating
    if (!editingId && !cover) {
      showPopup("Warning", "Please select a book cover", Intent.WARNING);
      return;
    }

    try {
      setSaving(true);

      // FormData handles text + image
      const data = new FormData();

      data.append("title", formData.title);
      data.append("author", formData.author);
      data.append("genre", formData.genre);

      // Extract just the year if it's a full date string (YYYY-MM-DD)
      const yearStr = String(formData.yearPublished);
      const year = yearStr.includes("-") ? yearStr.split("-")[0] : yearStr;
      data.append("yearPublished", year);

      // Add cover if selected
      if (cover) {
        data.append("cover", cover);
      }

      // Create
      let url = API_URL;
      let method = "POST";

      // Update
      if (editingId) {
        url = `${API_URL}/${editingId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        body: data,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Operation failed on server");
      }

      if (editingId) {
        showPopup("Success", "Book updated successfully", Intent.SUCCESS);
      } else {
        showPopup("Success", "Book created successfully", Intent.SUCCESS);
      }

      // Clear form
      resetForm();

      // Reload books
      await fetchBooks(authorFilter);
    } catch (error) {
      showPopup("Error", formatErrorMessage(error), Intent.DANGER);
    } finally {
      setSaving(false);
    }
  }

  // Edit Book
  function handleEdit(book) {
    // Save book ID
    setEditingId(book._id);

    // Put existing data in form
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      yearPublished: book.yearPublished || "",
    });

    // New image has not been selected
    setCover(null);

    // Show current image
    setPreview(book.coverImage?.url || "");

    // Reset file input
    setFileInputKey((previous) => previous + 1);

    // Go to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Delete Book
  function handleDelete(id) {
    showPopup(
      "Confirm Deletion",
      "Are you sure you want to delete this book?",
      Intent.DANGER,
      async () => {
        try {
          const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.message || "Delete failed");
          }

          // Close details window if necessary
          if (selectedBook?._id === id) {
            setSelectedBook(null);
          }

          showPopup("Success", "Book deleted successfully", Intent.SUCCESS);

          // Refresh books
          await fetchBooks(authorFilter);
        } catch (error) {
          showPopup("Error", formatErrorMessage(error), Intent.DANGER);
        }
      },
      true
    );
  }

  // Get Single Book
  async function handleViewDetails(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`);
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Unable to load book details");
      }

      // Open Blueprint Dialog
      setSelectedBook(result);
    } catch (error) {
      showPopup("Error", formatErrorMessage(error), Intent.DANGER);
    }
  }

  // Filter Books
  function handleFilter(event) {
    event.preventDefault();

    fetchBooks(authorFilter);
  }

  // Clear Filter
  function clearFilter() {
    setAuthorFilter("");

    fetchBooks("");
  }

  // Reset Form
  function resetForm() {
    setFormData({
      title: "",
      author: "",
      genre: "",
      yearPublished: "",
    });

    setCover(null);

    // Remove temporary browser URL
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview("");
    setEditingId(null);

    // Reset file input
    setFileInputKey((previous) => previous + 1);
  }

  return (
    <div>
      <Navbar>
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading>Book Library App</NavbarHeading>
        </NavbarGroup>
      </Navbar>

      <main className="app-container">
        {/* Global Popup Message */}
        <Dialog
          isOpen={popupConfig.isOpen}
          onClose={() => closePopup(false)}
          title={popupConfig.title}
          icon={popupConfig.intent === Intent.DANGER ? "error" : popupConfig.intent === Intent.SUCCESS ? "tick" : popupConfig.intent === Intent.WARNING ? "warning-sign" : "info-sign"}
        >
          <DialogBody>
            <p>{popupConfig.message}</p>
          </DialogBody>
          <div className="dialog-footer" style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            {popupConfig.showCancel && (
              <Button onClick={() => closePopup(false)}>
                Cancel
              </Button>
            )}
            <Button
              intent={popupConfig.intent}
              onClick={() => closePopup(true)}
            >
              {popupConfig.showCancel ? "Confirm" : "OK"}
            </Button>
          </div>
        </Dialog>

        {/* Add / Update form */}
        <Card elevation={Elevation.TWO} className="section-card">
          <h2>{editingId ? "Update Book" : "Add New Book"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormGroup label="Book Title" labelFor="title">
                <InputGroup
                  id="title"
                  name="title"
                  placeholder="Enter book title"
                  value={formData.title}
                  onChange={handleInputChange}
                  fill
                />
              </FormGroup>

              <FormGroup label="Author" labelFor="author">
                <InputGroup
                  id="author"
                  name="author"
                  placeholder="Enter author name"
                  value={formData.author}
                  onChange={handleInputChange}
                  fill
                />
              </FormGroup>

              <FormGroup label="Genre" labelFor="genre">
                <InputGroup
                  id="genre"
                  name="genre"
                  placeholder="Example: Fiction"
                  value={formData.genre}
                  onChange={handleInputChange}
                  fill
                />
              </FormGroup>

              <FormGroup label="Year Published" labelFor="yearPublished">
                <InputGroup
                  id="yearPublished"
                  name="yearPublished"
                  type="number"
                  min="1000"
                  max="2100"
                  step="1"
                  placeholder="e.g. 2024"
                  value={formData.yearPublished}
                  onChange={handleInputChange}
                  fill
                />
              </FormGroup>
            </div>

            {/* Input the image file */}
            <FormGroup
              label="Book Cover"
              helperText={
                editingId
                  ? "Choose a new image only if you want to replace the current cover."
                  : "Select JPG, JPEG, PNG or another image file."
              }
            >
              <FileInput
                key={fileInputKey}
                fill
                buttonText="Browse"
                text={
                  cover
                    ? cover.name
                    : editingId
                    ? "Choose new cover (optional)"
                    : "Choose book cover"
                }
                hasSelection={Boolean(cover)}
                onInputChange={handleImageChange}
                inputProps={{
                  accept: "image/*",
                }}
              />
            </FormGroup>

            {/* Image preview */}
            {preview && (
              <div className="preview-container">
                <h4>Cover Preview</h4>
                <img
                  src={preview}
                  alt="Book cover preview"
                  className="preview-image"
                />
              </div>
            )}

            {/* Form Buttons */}
            <div className="button-row">
              <Button
                type="submit"
                intent={Intent.PRIMARY}
                loading={saving}
              >
                {editingId ? "Update Book" : "Add Book"}
              </Button>

              {editingId && (
                <Button type="button" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Author Filter */}
        <Card elevation={Elevation.ONE} className="section-card">
          <h2>Filter by Author</h2>

          <form className="filter-row" onSubmit={handleFilter}>
            <InputGroup
              placeholder="Example: Paulo Coelho"
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
              fill
            />

            <Button type="submit" intent={Intent.PRIMARY}>
              Filter
            </Button>

            <Button type="button" onClick={clearFilter}>
              Clear
            </Button>
          </form>
        </Card>

        {/* Book List */}
        <h2>Books List</h2>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-container">
            <Spinner intent={Intent.PRIMARY} size={40} />
            <p>Loading books...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && books.length === 0 && (
          <Card elevation={Elevation.ONE}>
            <p className="center-text">No books found.</p>
          </Card>
        )}

        {/* Books */}
        {!loading && books.length > 0 && (
          <div className="book-grid">
            {books.map((book) => (
              <Card
                key={book._id}
                elevation={Elevation.TWO}
                className="book-card"
              >
                <img
                  src={book.coverImage?.url}
                  alt={book.title}
                  className="book-cover"
                />

                <div className="book-content">
                  <h3>{book.title}</h3>

                  <p>
                    <strong>Author:</strong> {book.author}
                  </p>

                  <p>
                    <strong>Genre:</strong> {book.genre}
                  </p>

                  <p>
                    <strong>Year Published:</strong> {book.yearPublished}
                  </p>

                  {/* CRUD buttons */}
                  <div className="book-buttons">
                    <Button
                      small
                      onClick={() => handleViewDetails(book._id)}
                    >
                      Details
                    </Button>

                    {!authorFilter && (
                      <>
                        <Button
                          small
                          intent={Intent.WARNING}
                          onClick={() => handleEdit(book)}
                        >
                          Edit
                        </Button>

                        <Button
                          small
                          intent={Intent.DANGER}
                          onClick={() => handleDelete(book._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Blueprint details */}
        <Dialog
          isOpen={Boolean(selectedBook)}
          onClose={() => setSelectedBook(null)}
          title="Book Details"
        >
          {selectedBook && (
            <>
              <DialogBody>
                <div className="details-content">
                  <img
                    src={selectedBook.coverImage?.url}
                    alt={selectedBook.title}
                    className="details-image"
                  />

                  <h2>{selectedBook.title}</h2>

                  <p>
                    <strong>Author:</strong> {selectedBook.author}
                  </p>

                  <p>
                    <strong>Genre:</strong> {selectedBook.genre}
                  </p>

                  <p>
                    <strong>Year Published:</strong>{" "}
                    {selectedBook.yearPublished}
                  </p>
                </div>
              </DialogBody>

              <div className="dialog-footer" style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={() => setSelectedBook(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </main>
    </div>
  );
}

export default App;
