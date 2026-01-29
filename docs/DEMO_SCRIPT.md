# RescueChain Demo Script - 3 Minutes

## Overview
This script demonstrates the core features of the RescueChain disaster management platform, covering victim complaints, NGO workflows, fraud detection, donations, and SDMA auditing.

---

## Demo Flow (3 Minutes)

### **Scene 1: Victim Creates Complaint** (30 seconds)

**Narrator:** "Let's start with a victim in distress. They need immediate rescue assistance."

**Actions:**
1. Show victim login portal (OTP-based authentication)
2. Navigate to "Create Complaint" form
3. Fill in complaint details:
   - **Complaint Text**: "Flood situation in Sector 15, urgent help needed"
   - **Location**: "Sector 15, Noida"
   - **Urgency Level**: High
4. **Upload photo** (MANDATORY - demonstrate requirement)
   - Select photo of the disaster scene
   - Show photo preview
5. Click "Submit Complaint"
6. Show success message: "Complaint created successfully"
7. Display complaint status: **"Submitted"**

**Key Points to Highlight:**
- ✅ Photo upload is **mandatory** for complaint creation
- ✅ Real-time GPS location capture
- ✅ Complaint immediately logged in system

---

### **Scene 2: NGO Updates Status** (45 seconds)

**Narrator:** "Now, an NGO receives and accepts this complaint, then updates the status as their rescue team progresses."

**Actions:**
1. Switch to NGO portal (login: `redcross` / password: `password123`)
2. Show complaint dashboard with "Submitted" complaints
3. Click on the complaint from Scene 1
4. **Status Update 1 - Accept:**
   - Select status: "Accepted"
   - Add notes: "Complaint accepted, rescue team dispatched"
   - Click "Update Status"
   - Show status changed to **"Accepted"**
5. **Status Update 2 - Arriving:**
   - Select status: "Arriving"
   - **Upload photo evidence** (mandatory for physical statuses)
   - Add notes: "Rescue team arriving at location"
   - Click "Update Status"
   - Show status changed to **"Arriving"**
6. **Status Update 3 - In Progress:**
   - Select status: "In Progress"
   - **Upload photo evidence**
   - Add notes: "Rescue operation in progress"
   - Click "Update Status"
   - Show status changed to **"In Progress"**

**Key Points to Highlight:**
- ✅ Status transitions follow proper workflow (cannot skip steps)
- ✅ Photo evidence **required** for physical statuses (Arriving, In Progress, Resolved)
- ✅ Photo evidence **NOT required** for "Accepted" status
- ✅ Complete audit trail maintained

---

### **Scene 3: Fake Information Case** (30 seconds)

**Narrator:** "Sometimes NGOs encounter false reports. The system has built-in fraud detection."

**Actions:**
1. Show another complaint in the NGO dashboard
2. NGO investigates and finds it's false information
3. Click on complaint → "Update Status"
4. Select status: **"Fake Information"**
5. **Required field appears**: "Reason" (mandatory)
   - Enter reason: "Location verified - no flood situation exists. Photo appears to be from previous year."
6. **Upload photo evidence** (required even for fake_information)
7. Click "Update Status"
8. Show status changed to **"Fake Information"**
9. **Highlight**: Status is now **locked** (terminal status - cannot be changed by NGO)
10. Show message: "Complaint marked as fake information. Status locked for audit."

**Key Points to Highlight:**
- ✅ Fake information detection with reason requirement
- ✅ Photo evidence required even for fake_information
- ✅ Terminal status - locks complaint (only SDMA can override)
- ✅ Prevents abuse and maintains data integrity

---

### **Scene 4: Donation via QR** (35 seconds)

**Narrator:** "The platform supports donations to support rescue operations. Users can donate through UPI QR codes."

**Actions:**
1. Navigate to "Donate" page (public or authenticated)
2. Show donation form:
   - **Select NGO**: Choose "Red Cross" from dropdown
   - **Donor Information** (optional):
     - Name: "John Doe"
     - Phone: "+91 98765 43210"
     - Email: "john@example.com"
3. Click "Create Donation Intent"
4. **QR Code Display:**
   - Show common UPI QR code image
   - Display message: "Scan QR code to complete payment"
5. **Simulate payment:**
   - Click "I have completed payment" button
   - Confirm payment (optional: enter amount and UPI transaction ID)
6. Show success: "Payment confirmed successfully. Thank you for your donation!"
7. Display donation receipt with:
   - Donation ID
   - NGO name: "Red Cross"
   - Status: "Completed"
   - Timestamp

**Key Points to Highlight:**
- ✅ NGO selection before donation
- ✅ Common UPI QR code for all donations
- ✅ App doesn't process payments - only logs donation intent
- ✅ Transparent donation tracking

---

### **Scene 5: SDMA Audit View** (40 seconds)

**Narrator:** "SDMA, the state authority, has full visibility into all system activities, including blockchain audit logs."

**Actions:**
1. Switch to SDMA portal (login: `sdma_admin` / password: `password123`)
2. Navigate to **"Audit Timeline"** or **"Blockchain Audit Logs"**
3. Show audit dashboard with:
   - **All system activities** (complaints, donations, status changes)
   - **Blockchain transaction hashes** (Polygon network)
   - **Timestamps** for each action
   - **User details** (who performed action)
4. **Filter by entity type:**
   - Filter: "Complaint" → Show all complaint-related activities
   - Filter: "Donation" → Show all donation activities
5. **Expand a complaint audit log:**
   - Show: Complaint creation
   - Polygon TX Hash: `0xabc123...`
   - Block Number: 12345
   - Created by: Victim (Phone: +91...)
   - Timestamp
6. **Expand a status change audit log:**
   - Show: Status change from "Submitted" to "Accepted"
   - Changed by: NGO (Red Cross)
   - Polygon TX Hash: `0xdef456...`
   - Old data vs New data comparison
7. **Expand a fake_information audit log:**
   - Show the fake information case from Scene 3
   - Highlight: Reason field captured
   - Show: Terminal status - locked for audit
8. **Show donation audit:**
   - Filter: Entity Type = "Donation"
   - Show donation amounts (visible only to SDMA)
   - Show blockchain transaction hash

**Key Points to Highlight:**
- ✅ **Complete transparency** - SDMA sees all system activities
- ✅ **Blockchain-backed audit trail** - immutable records on Polygon
- ✅ **Full visibility** into donation amounts (hidden from public/NGOs)
- ✅ **Accountability** - every action is logged and traceable
- ✅ **Tamper-proof** records via blockchain

---

## Closing Summary (10 seconds)

**Narrator:** "RescueChain provides a transparent, auditable disaster management platform with blockchain-backed records, ensuring accountability at every step from victim complaints to NGO responses, fraud detection, and financial transparency."

---

## Key System Features Demonstrated

1. ✅ **Victim Complaint Creation** - Photo-mandatory complaint submission
2. ✅ **NGO Status Management** - Proper workflow with photo evidence requirements
3. ✅ **Fraud Detection** - Fake information reporting with terminal status
4. ✅ **Donation System** - UPI QR-based donations with NGO selection
5. ✅ **SDMA Audit & Transparency** - Blockchain audit logs with full system visibility

---

## Demo Preparation Notes

### Test Accounts:
- **Victim**: Use OTP login (any phone number)
- **NGO**: `redcross` / `password123`
- **SDMA**: `sdma_admin` / `password123`

### Sample Data:
- Ensure test complaints exist with various statuses
- Have sample photos ready for upload
- Pre-create a fake_information complaint for Scene 3
- Ensure UPI QR code image exists at `/assets/common_upi_qr.png`

### Technical Setup:
- Backend server running
- Database seeded with test data
- Blockchain audit logging enabled (may use mock hashes if Polygon not configured)

---

## Timing Breakdown

| Scene | Duration | Cumulative |
|-------|----------|------------|
| Scene 1: Victim Complaint | 30s | 0:30 |
| Scene 2: NGO Status Updates | 45s | 1:15 |
| Scene 3: Fake Information | 30s | 1:45 |
| Scene 4: Donation via QR | 35s | 2:20 |
| Scene 5: SDMA Audit View | 40s | 3:00 |
| **Total** | **3:00** | **3:00** |

---

## Notes for Presenter

- **Pace**: Keep transitions smooth and fast - this is a feature demonstration
- **Emphasize**: Photo requirements, blockchain audit, and SDMA transparency
- **Show, don't tell**: Let the UI demonstrate the features
- **Practice**: Rehearse screen transitions to stay within 3 minutes
