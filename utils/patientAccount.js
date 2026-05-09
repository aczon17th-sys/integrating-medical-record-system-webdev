const Patient = require("../models/Patient");
const User = require("../models/User");

const normalizeId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const buildFallbackName = (user) => {
  if (user.username) {
    return user.username;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return `Patient ${user.id}`;
};

const findPatientByLinkedId = async (patientId) => {
  const linkedId = normalizeId(patientId);
  return linkedId ? Patient.findByPk(linkedId) : null;
};

const ensurePatientForUser = async (authUser) => {
  if (!authUser || authUser.role !== "patient") {
    return null;
  }

  const user = await User.findByPk(authUser.id);

  if (!user) {
    return null;
  }

  const linkedPatient = await findPatientByLinkedId(user.patientId || authUser.patientId);

  if (linkedPatient) {
    if (!user.patientId) {
      await user.update({ patientId: linkedPatient.id });
    }

    return linkedPatient;
  }

  const existingPatient = user.email ? await Patient.findOne({ where: { email: user.email } }) : null;

  if (existingPatient) {
    await user.update({ patientId: existingPatient.id });
    return existingPatient;
  }

  const patient = await Patient.create({
    fullname: buildFallbackName(user),
    email: user.email || null,
    identityVerified: false
  });

  await user.update({ patientId: patient.id });
  return patient;
};

module.exports = {
  ensurePatientForUser,
  normalizeId
};
