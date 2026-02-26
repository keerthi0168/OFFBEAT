const cloudinary = require('cloudinary').v2;

// Upload photo from file (multipart form data)
exports.uploadPhoto = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: 'OffbeatTravelIndia/Places',
        resource_type: 'auto',
      })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map((result) => result.secure_url);

    res.status(200).json(urls);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Error uploading files',
      error: error.message,
    });
  }
};

// Upload photo from URL link
exports.uploadByLink = async (req, res) => {
  try {
    const { link } = req.body;

    if (!link) {
      return res.status(400).json({ message: 'No link provided' });
    }

    const result = await cloudinary.uploader.upload(link, {
      folder: 'OffbeatTravelIndia/Places',
      resource_type: 'auto',
    });

    res.status(200).json(result.secure_url);
  } catch (error) {
    console.error('Upload by link error:', error);
    res.status(500).json({
      message: 'Error uploading from link',
      error: error.message,
    });
  }
};
