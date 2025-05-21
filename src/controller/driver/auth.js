const { pool } = require("../../config/db");
const { getDriverOtp } = require("../../utils/otpManager");
const { getJwtToken } = require("../../utils/jwtManager");
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = require("../../config/secrets");
const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendDriverOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    if (!phone || !countryCode) {
      return res
        .status(400)
        .json({ error: "Phone number and country code required" });
    }

    // Check if van exists and is active
    const [van] = await pool.query(
      "SELECT id FROM vans WHERE phone = ? AND country_code = ? AND status = true",
      [phone, countryCode]
    );

    // @ts-ignore
    if (!van.length) {
      return res.status(404).json({ error: "Van not found or inactive" });
    }

    const otp = getDriverOtp();

    await pool.query(
      "INSERT INTO otp (phone, country_code, otp) VALUES (?, ?, ?)",
      [phone, countryCode, otp]
    );

    // Send OTP via Twilio
    await twilio.messages.create({
      body: `Your Washify driver verification code is: ${otp}. Valid for 5 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: `+${countryCode}${phone}`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === 21614) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyDriverOtp = async (req, res) => {
  try {
    const { phone, otp, countryCode } = req.body;
    if (!phone || !otp || !countryCode) {
      return res
        .status(400)
        .json({ error: "Phone, OTP and country code required" });
    }

    // Verify OTP
    const [otpRecord] = await pool.query(
      "SELECT id FROM otp WHERE phone = ? AND country_code = ? AND otp = ? AND created_at > NOW() - INTERVAL 5 MINUTE",
      [phone, countryCode, otp]
    );
    // @ts-ignore
    if (!otpRecord.length) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // Get van details
    const [van] = await pool.query(
      "SELECT id, van_number, region_id FROM vans WHERE phone = ? AND country_code = ? AND status = true",
      [phone, countryCode]
    );

    // Generate JWT token
    const token = getJwtToken({
      id: van[0].id,
      vanNumber: van[0].van_number,
      regionId: van[0].region_id,
      phone,
      role: "driver",
    });

    // Delete used OTP
    await pool.query("DELETE FROM otp WHERE phone = ? AND country_code = ?", [
      phone,
      countryCode,
    ]);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { sendDriverOtp, verifyDriverOtp };
