const axios = require('axios');

exports.lookupReg = async (req, res) => {
  try {
    const plate = req.params.plate.toUpperCase().replace(/\s/g, '');

    const { data } = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: plate },
      {
        headers: {
          'x-api-key':    process.env.DVLA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      reg:            plate,
      make:           data.make,
      model:          data.model || data.vehicleModel || null,
      colour:         data.colour,
      year:           data.yearOfManufacture,
      fuelType:       data.fuelType,
      engineCapacity: data.engineCapacity,
      motStatus:      data.motStatus,
      motExpiry:      data.motExpiryDate,
      taxStatus:      data.taxStatus,
      taxDueDate:     data.taxDueDate,
      co2Emissions:   data.co2Emissions,
      source:         'DVLA'
    });

  } catch (err) {
    console.error('DVLA error:', err.response?.data || err.message);
    const status = err.response?.status;
    if (status === 404)
      return res.status(404).json({ error: 'Vehicle not found. Check the registration plate.' });
    if (status === 401)
      return res.status(401).json({ error: 'Invalid DVLA API key.' });
    if (status === 403)
      return res.status(403).json({ error: 'DVLA API access denied. Check your subscription.' });
    res.status(500).json({
      error:   'Reg plate lookup failed',
      details: err.response?.data || err.message
    });
  }
};

exports.decodeVin = async (req, res) => {
  try {
    const vin = req.params.vin.toUpperCase();

    if (!process.env.VEHICLE_DB_API_KEY) {
      return res.status(503).json({ error: 'VIN API key not configured yet' });
    }

    const { data } = await axios.get(
      `${process.env.VEHICLE_DB_URL}/${vin}`,
      {
        headers: {
          'x-AuthKey':    process.env.VEHICLE_DB_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('VehicleDB response:', JSON.stringify(data, null, 2));

    const v = data.data || data;

    res.json({
      vin,
      make:         v.make         || v.Make,
      model:        v.model        || v.Model,
      year:         v.year         || v.ModelYear,
      trim:         v.trim         || v.Trim,
      engine:       v.engine       || v.engine_descriptor,
      cylinders:    v.cylinders    || v.EngineCylinders,
      fuelType:     v.fuel_type    || v.FuelTypePrimary,
      bodyClass:    v.body_type    || v.BodyClass,
      driveType:    v.drive_type   || v.DriveType,
      transmission: v.transmission || v.TransmissionStyle,
      doors:        v.doors,
      country:      v.plant_country|| v.PlantCountry,
      source:       'Vehicle Databases'
    });

  } catch (err) {
    console.error('VehicleDB error:', err.response?.data || err.message);
    const status = err.response?.status;
    if (status === 401)
      return res.status(401).json({ error: 'Invalid Vehicle Databases API key' });
    if (status === 403)
      return res.status(403).json({ error: 'API limit reached' });
    if (status === 404)
      return res.status(404).json({ error: 'VIN not found' });
    res.status(500).json({
      error:   'VIN decode failed',
      details: err.response?.data || err.message
    });
  }
};