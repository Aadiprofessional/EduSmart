// Updates needed for universityRoutes.js

// 1. Update the GET /api/universities route to include new fields
// Add these fields to your SELECT query:

const getAllUniversities = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { data: universities, error } = await supabase
      .from('universities')
      .select(`
        *,
        min_gpa_required,
        sat_score_required,
        act_score_required,
        ielts_score_required,
        toefl_score_required,
        gre_score_required,
        gmat_score_required,
        application_deadline_fall,
        application_deadline_spring,
        application_deadline_summer,
        tuition_fee_graduate,
        scholarship_available,
        financial_aid_available,
        application_requirements,
        admission_essay_required,
        letters_of_recommendation_required,
        interview_required,
        work_experience_required,
        portfolio_required
      `)
      .range(offset, offset + limit - 1)
      .order('ranking', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        universities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Update the GET /api/universities/:id route
const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: university, error } = await supabase
      .from('universities')
      .select(`
        *,
        min_gpa_required,
        sat_score_required,
        act_score_required,
        ielts_score_required,
        toefl_score_required,
        gre_score_required,
        gmat_score_required,
        application_deadline_fall,
        application_deadline_spring,
        application_deadline_summer,
        tuition_fee_graduate,
        scholarship_available,
        financial_aid_available,
        application_requirements,
        admission_essay_required,
        letters_of_recommendation_required,
        interview_required,
        work_experience_required,
        portfolio_required
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!university) {
      return res.status(404).json({ success: false, error: 'University not found' });
    }

    res.json({ success: true, data: university });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Add image upload functionality for Supabase Storage
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Image upload endpoint
const uploadUniversityImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `universities/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('university-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('university-images')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Add routes to your router
// router.post('/universities/upload-image', upload.single('image'), uploadUniversityImage);

module.exports = {
  getAllUniversities,
  getUniversityById,
  uploadUniversityImage,
  upload
}; 