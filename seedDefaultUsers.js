const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("./models/User");
const Patient = require("./models/Patient");
const Appointment = require("./models/Appointment");
const MedicalRecord = require("./models/MedicalRecord");
const Billing = require("./models/Billing");

const defaultUsers = [
  {
    username: "admin",
    email: "admin@system.local",
    password: "admin123",
    role: "admin",
    licenseId: null,
    staffId: null
  },
  {
    username: "doctor",
    email: "doctor@system.local",
    password: "doctor123",
    role: "doctor",
    licenseId: "MD-0001",
    staffId: null
  },
  {
    username: "staff",
    email: "staff@system.local",
    password: "staff123",
    role: "staff",
    licenseId: null,
    staffId: "STF-0001"
  }
];

const demoPatients = [
  {
    fullname: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    password: "patient123",
    validIdType: "PhilHealth ID",
    validIdNumber: "PH-1001",
    age: 36,
    gender: "Male",
    diagnosis: "Elevated blood pressure",
    prescription: "Losartan 50mg once daily",
    medications: "Low-salt diet and blood pressure monitoring.",
    appointmentDate: "2026-05-12",
    appointmentTime: "09:00",
    reason: "Follow-up check for blood pressure monitoring",
    serviceDescription: "Blood pressure consultation and follow-up"
  },
  {
    fullname: "Maria Reyes",
    email: "maria.reyes@example.com",
    password: "patient123",
    validIdType: "National ID",
    validIdNumber: "NID-1002",
    age: 41,
    gender: "Female",
    diagnosis: "Tension-type headache",
    prescription: "Paracetamol 500mg every 6 hours as needed",
    medications: "Increase fluids and track headache triggers.",
    appointmentDate: "2026-05-12",
    appointmentTime: "10:00",
    reason: "Consultation for recurring headache",
    serviceDescription: "Headache consultation"
  },
  {
    fullname: "Carlo Mendoza",
    email: "carlo.mendoza@example.com",
    password: "patient123",
    validIdType: "Driver License",
    validIdNumber: "DL-1003",
    age: 47,
    gender: "Male",
    diagnosis: "Diabetes follow-up",
    prescription: "Metformin 500mg twice daily",
    medications: "Nutrition counseling and repeat FBS in one month.",
    appointmentDate: "2026-05-13",
    appointmentTime: "09:30",
    reason: "Diabetes review and medication check",
    serviceDescription: "Diabetes review"
  },
  {
    fullname: "Liza Garcia",
    email: "liza.garcia@example.com",
    password: "patient123",
    validIdType: "National ID",
    validIdNumber: "NID-1004",
    age: 31,
    gender: "Female",
    diagnosis: "Prenatal wellness visit",
    prescription: "Prenatal vitamins once daily",
    medications: "Schedule follow-up prenatal visit in four weeks.",
    appointmentDate: "2026-05-13",
    appointmentTime: "14:00",
    reason: "Prenatal wellness consultation",
    serviceDescription: "Prenatal wellness consultation"
  },
  {
    fullname: "Ana Villanueva",
    email: "ana.villanueva@example.com",
    password: "patient123",
    validIdType: "Barangay ID",
    validIdNumber: "BID-1005",
    age: 24,
    gender: "Female",
    diagnosis: "Post-fever recovery",
    prescription: "Cetirizine 10mg once daily for five days",
    medications: "Rest and hydration advised.",
    appointmentDate: "2026-05-14",
    appointmentTime: "08:30",
    reason: "General checkup after fever",
    serviceDescription: "General checkup"
  }
];

const seedDefaultUsers = async () => {
  const seededUsers = {};

  for (const account of defaultUsers) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: account.username },
          { email: account.email }
        ]
      }
    });

    if (user) {
      await user.update({
        username: account.username,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        licenseId: account.licenseId,
        staffId: account.staffId
      });
      seededUsers[account.username] = user;
    } else {
      seededUsers[account.username] = await User.create({
        username: account.username,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        licenseId: account.licenseId,
        staffId: account.staffId
      });
    }
  }

  const doctor = seededUsers.doctor || await User.findOne({ where: { username: "doctor" } });

  for (const demo of demoPatients) {
    const patientPayload = {
      fullname: demo.fullname,
      email: demo.email,
      validIdType: demo.validIdType,
      validIdNumber: demo.validIdNumber,
      identityVerified: true,
      age: demo.age,
      gender: demo.gender,
      diagnosis: demo.diagnosis,
      prescription: demo.prescription,
      medications: demo.medications,
      followUpNeeded: false,
      followUpNote: null
    };

    let patient = await Patient.findOne({ where: { email: demo.email } });

    if (patient) {
      await patient.update(patientPayload);
    } else {
      patient = await Patient.create(patientPayload);
    }

    const hashedPassword = await bcrypt.hash(demo.password, 10);
    const patientUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: demo.email },
          { email: demo.email }
        ]
      }
    });

    if (patientUser) {
      await patientUser.update({
        username: demo.email,
        email: demo.email,
        password: hashedPassword,
        role: "patient",
        licenseId: null,
        staffId: null,
        patientId: patient.id
      });
    } else {
      await User.create({
        username: demo.email,
        email: demo.email,
        password: hashedPassword,
        role: "patient",
        patientId: patient.id
      });
    }

    let appointment = await Appointment.findOne({
      where: {
        patientId: patient.id,
        reason: demo.reason
      }
    });

    const appointmentPayload = {
      patientId: patient.id,
      patientName: patient.fullname,
      appointmentDate: demo.appointmentDate,
      appointmentTime: demo.appointmentTime,
      reason: demo.reason,
      status: "completed"
    };

    if (appointment) {
      await appointment.update(appointmentPayload);
    } else {
      appointment = await Appointment.create(appointmentPayload);
    }

    const recordPayload = {
      patientId: patient.id,
      patientName: patient.fullname,
      doctorId: doctor.id,
      doctorName: doctor.username,
      appointmentId: appointment.id,
      diagnosis: demo.diagnosis,
      prescription: demo.prescription,
      medications: demo.medications,
      therapies: null,
      followUpNeeded: false,
      followUpNote: null
    };

    const record = await MedicalRecord.findOne({
      where: {
        patientId: patient.id,
        appointmentId: appointment.id
      }
    });

    if (record) {
      await record.update(recordPayload);
    } else {
      await MedicalRecord.create(recordPayload);
    }

    const billingPayload = {
      patientId: patient.id,
      patientName: patient.fullname,
      statementDate: demo.appointmentDate,
      serviceDescription: demo.serviceDescription,
      amount: 500,
      discountType: "none",
      discountAmount: 0,
      totalAmount: 500,
      paymentMethod: "cash",
      paymentStatus: "unpaid"
    };

    const billing = await Billing.findOne({
      where: {
        patientId: patient.id,
        serviceDescription: demo.serviceDescription
      }
    });

    if (billing) {
      await billing.update(billingPayload);
    } else {
      await Billing.create(billingPayload);
    }
  }
};

module.exports = {
  defaultUsers,
  demoPatients,
  seedDefaultUsers
};
