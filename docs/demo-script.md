# ENTITLE Demo Script

## Part 1: Core Loop (Phase 1)
1. **Introduction:** Briefly explain ENTITLE's purpose: Rule Engine decides, AI explains, Blockchain verifies.
2. **Citizen Flow:**
   - Open Web App, click "Find Schemes".
   - Answer Assistant questions (e.g., Age 35, Farmer, Income 2 Lakh, from Maharashtra).
3. **Results & AI Explanation:**
   - View Dashboard showing eligible schemes (e.g., PM Kisan).
   - Click "Explain Why" to see Gemini-generated explanation of eligibility.
4. **Blockchain Certificate:**
   - Complete application, issue certificate.
   - Show the resulting QR code and Polygon Amoy explorer link confirming the tamper-proof hash.

## Part 2: Verifiable Credentials (Phase 2)
1. **The Problem:** Citizens shouldn't have to upload the same Income Certificate for different schemes.
2. **Cross-Department Verification Demo:**
   - *Step 1:* Citizen applies for a scheme requiring an Income Certificate.
   - *Step 2:* Revenue Department issues a Verifiable Credential on the `DocumentCredentialRegistry` (Amoy testnet).
   - *Step 3:* Citizen applies for a second scheme (e.g., Education Scholarship). The system automatically queries the registry, finds the valid Income Certificate, and skips the document upload step.
3. **Revocation:**
   - *Step 4:* The Revenue Department realizes a mistake and revokes the credential.
   - *Step 5:* The citizen attempts to use it again, but the system shows "⚠ Revoked" and requests a new document upload.
4. **Conclusion:** Highlighting privacy and efficiency through zero-knowledge verifiable credentials.
