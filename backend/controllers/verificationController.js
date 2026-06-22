const { query } = require("../config/db");

/* ══════════════════════════════════════════════════════════════
   SUBMIT VERIFICATION
   POST /api/verification/submit
══════════════════════════════════════════════════════════════ */
const submitVerification = async (req, res) => {
  const userId = req.user.id;
  const {
    store_id, account_type,
    /* personal */
    full_legal_name, id_number, date_of_birth, residential_address, phone_number,
    /* business */
    legal_business_name, trade_name, cipc_registration_number, vat_number, business_address, business_phone,
    beneficial_owners,
    /* banking */
    bank_name, bank_account_holder, bank_account_number, bank_branch_code, bank_account_type,
    /* documents */
    id_document_url, proof_of_address_url, bank_confirmation_url, cipc_document_url, vat_certificate_url,
  } = req.body;

  if (!store_id || !account_type) {
    return res.status(400).json({ success: false, message: "store_id and account_type are required." });
  }

  /* Confirm vendor owns this store */
  const storeCheck = await query("SELECT id FROM stores WHERE id = $1 AND owner_id = $2", [store_id, userId]);
  if (storeCheck.rows.length === 0) {
    return res.status(403).json({ success: false, message: "Not authorised for this store." });
  }

  /* Business accounts require beneficial owner info if any owner has >25% */
  if (account_type === "business") {
    if (!legal_business_name || !cipc_registration_number) {
      return res.status(400).json({ success: false, message: "Legal business name and CIPC registration number are required for business accounts." });
    }
  } else {
    if (!full_legal_name || !id_number) {
      return res.status(400).json({ success: false, message: "Full legal name and ID number are required for personal accounts." });
    }
  }

  if (!id_document_url) {
    return res.status(400).json({ success: false, message: "A government-issued photo ID is required." });
  }

  try {
    /* Upsert — one verification record per store */
    const existing = await query("SELECT id FROM vendor_verifications WHERE store_id = $1", [store_id]);

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE vendor_verifications SET
           account_type = $1, full_legal_name = $2, id_number = $3, date_of_birth = $4,
           residential_address = $5, phone_number = $6, legal_business_name = $7, trade_name = $8,
           cipc_registration_number = $9, vat_number = $10, business_address = $11, business_phone = $12,
           beneficial_owners = $13, bank_name = $14, bank_account_holder = $15, bank_account_number = $16,
           bank_branch_code = $17, bank_account_type = $18, id_document_url = $19, proof_of_address_url = $20,
           bank_confirmation_url = $21, cipc_document_url = $22, vat_certificate_url = $23,
           status = 'pending', submitted_at = NOW(), updated_at = NOW()
         WHERE store_id = $24 RETURNING *`,
        [account_type, full_legal_name, id_number, date_of_birth, residential_address, phone_number,
         legal_business_name, trade_name, cipc_registration_number, vat_number, business_address, business_phone,
         JSON.stringify(beneficial_owners || []), bank_name, bank_account_holder, bank_account_number,
         bank_branch_code, bank_account_type, id_document_url, proof_of_address_url,
         bank_confirmation_url, cipc_document_url, vat_certificate_url, store_id]
      );
    } else {
      result = await query(
        `INSERT INTO vendor_verifications (
           store_id, user_id, account_type, full_legal_name, id_number, date_of_birth, residential_address, phone_number,
           legal_business_name, trade_name, cipc_registration_number, vat_number, business_address, business_phone,
           beneficial_owners, bank_name, bank_account_holder, bank_account_number, bank_branch_code, bank_account_type,
           id_document_url, proof_of_address_url, bank_confirmation_url, cipc_document_url, vat_certificate_url
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
         RETURNING *`,
        [store_id, userId, account_type, full_legal_name, id_number, date_of_birth, residential_address, phone_number,
         legal_business_name, trade_name, cipc_registration_number, vat_number, business_address, business_phone,
         JSON.stringify(beneficial_owners || []), bank_name, bank_account_holder, bank_account_number,
         bank_branch_code, bank_account_type, id_document_url, proof_of_address_url,
         bank_confirmation_url, cipc_document_url, vat_certificate_url]
      );
    }

    /* Update store status */
    await query(
      "UPDATE stores SET account_type = $1, verification_status = 'pending' WHERE id = $2",
      [account_type, store_id]
    );

    res.status(200).json({
      success: true,
      verification: result.rows[0],
      message: "Verification submitted. Most accounts are reviewed within 1-2 business days.",
    });
  } catch (err) {
    console.error("Submit verification error:", err.message);
    res.status(500).json({ success: false, message: "Failed to submit verification." });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET MY VERIFICATION STATUS
   GET /api/verification/store/:storeId
══════════════════════════════════════════════════════════════ */
const getVerification = async (req, res) => {
  const { storeId } = req.params;

  const storeCheck = await query("SELECT id FROM stores WHERE id = $1 AND owner_id = $2", [storeId, req.user.id]);
  if (storeCheck.rows.length === 0) {
    return res.status(403).json({ success: false, message: "Not authorised." });
  }

  const result = await query("SELECT * FROM vendor_verifications WHERE store_id = $1", [storeId]);

  res.status(200).json({
    success: true,
    verification: result.rows[0] || null,
  });
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: LIST PENDING VERIFICATIONS
   GET /api/verification/admin/pending
══════════════════════════════════════════════════════════════ */
const getPendingVerifications = async (req, res) => {
  const result = await query(
    `SELECT v.*, s.name AS store_name, u.email AS user_email
     FROM vendor_verifications v
     JOIN stores s ON v.store_id = s.id
     JOIN users u ON v.user_id = u.id
     WHERE v.status IN ('pending', 'under_review')
     ORDER BY v.submitted_at ASC`
  );
  res.status(200).json({ success: true, verifications: result.rows });
};

/* ══════════════════════════════════════════════════════════════
   ADMIN: APPROVE / REJECT / REQUEST MORE DOCS
   PUT /api/verification/admin/:id/review
══════════════════════════════════════════════════════════════ */
const reviewVerification = async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; /* decision: 'verified' | 'rejected' | 'documents_requested' */

  const valid = ["verified", "rejected", "documents_requested"];
  if (!valid.includes(decision)) {
    return res.status(400).json({ success: false, message: "Invalid decision." });
  }

  const result = await query(
    `UPDATE vendor_verifications
     SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [decision, reason || null, req.user.id, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: "Verification not found." });
  }

  const verification = result.rows[0];

  /* Sync store verification_status */
  const storeStatusMap = { verified: "verified", rejected: "rejected", documents_requested: "pending" };
  await query(
    "UPDATE stores SET verification_status = $1, verification_notes = $2 WHERE id = $3",
    [storeStatusMap[decision], reason || null, verification.store_id]
  );

  /* Notify vendor */
  try {
    const { sendNotification } = require("./notificationController");
    const messages = {
      verified:             ["Account verified! ✅", "Your seller account has been verified. You can now receive payouts."],
      rejected:              ["Verification unsuccessful", reason || "Your verification could not be approved. Please review and resubmit."],
      documents_requested:   ["Additional documents needed", reason || "We need a few more documents to complete your verification."],
    };
    const [title, body] = messages[decision];
    await sendNotification(verification.user_id, "verification_update", title, body, { store_id: verification.store_id });
  } catch { /* non-critical */ }

  res.status(200).json({ success: true, verification });
};

module.exports = {
  submitVerification,
  getVerification,
  getPendingVerifications,
  reviewVerification,
};
