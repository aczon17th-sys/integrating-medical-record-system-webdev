const Billing = require("../models/Billing");

const discountRates = {
  none: 0,
  philhealth: 0.1,
  senior: 0.2,
  pwd: 0.2
};

const validateBenefitId = (body) => {
  if (body.discountType === "philhealth" && !body.philhealthId) {
    return "PhilHealth ID is required for PhilHealth benefits";
  }

  if (body.discountType === "senior" && !body.seniorCitizenId) {
    return "Senior Citizen ID is required for senior discount benefits";
  }

  if (body.discountType === "pwd" && !body.pwdId) {
    return "PWD ID is required for PWD discount benefits";
  }

  return null;
};

const buildBillingPayload = (body) => {
  const amount = Number(body.amount || 0);
  const discountType = body.discountType || "none";
  const discountAmount = Number((amount * (discountRates[discountType] || 0)).toFixed(2));
  const totalAmount = Number(Math.max(amount - discountAmount, 0).toFixed(2));

  return {
    patientName: body.patientName,
    statementDate: body.statementDate,
    serviceDescription: body.serviceDescription,
    amount,
    philhealthId: body.philhealthId || null,
    seniorCitizenId: body.seniorCitizenId || null,
    pwdId: body.pwdId || null,
    discountType,
    discountAmount,
    totalAmount,
    paymentMethod: body.paymentMethod || "cash",
    paymentStatus: body.paymentStatus || "unpaid"
  };
};

exports.getBillings = async (req, res) => {
  try {
    const billings = await Billing.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.json(billings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch billing statements", error: error.message });
  }
};

exports.createBilling = async (req, res) => {
  try {
    const { patientName, statementDate, serviceDescription } = req.body;

    if (!patientName || !statementDate || !serviceDescription) {
      return res.status(400).json({ message: "Patient name, statement date, and service description are required" });
    }

    const benefitError = validateBenefitId(req.body);

    if (benefitError) {
      return res.status(400).json({ message: benefitError });
    }

    const billing = await Billing.create(buildBillingPayload(req.body));
    res.status(201).json(billing);
  } catch (error) {
    res.status(400).json({ message: "Failed to create billing statement", error: error.message });
  }
};

exports.updateBilling = async (req, res) => {
  try {
    const billing = await Billing.findByPk(req.params.id);

    if (!billing) {
      return res.status(404).json({ message: "Billing statement not found" });
    }

    const benefitError = validateBenefitId(req.body);

    if (benefitError) {
      return res.status(400).json({ message: benefitError });
    }

    await billing.update(buildBillingPayload({ ...billing.toJSON(), ...req.body }));
    res.json(billing);
  } catch (error) {
    res.status(400).json({ message: "Failed to update billing statement", error: error.message });
  }
};

exports.deleteBilling = async (req, res) => {
  try {
    const billing = await Billing.findByPk(req.params.id);

    if (!billing) {
      return res.status(404).json({ message: "Billing statement not found" });
    }

    await billing.destroy();
    res.json({ message: "Billing statement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete billing statement", error: error.message });
  }
};
