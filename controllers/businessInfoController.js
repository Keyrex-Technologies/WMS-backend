import BusinessInfo from '../models/BusinessInfo.model.js';

// Business Info Controller Functions

export const createBusinessInfo = async (req, res) => {
    try {
        const existingInfo = await BusinessInfo.findOne();
        if (existingInfo) {
            return res.status(400).json({
                success: false,
                message: 'Business information already exists. Use the update endpoint instead.'
            });
        }

        const businessInfo = new BusinessInfo(req.body);
        await businessInfo.save();

        res.status(201).json({
            success: true,
            data: businessInfo
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


export const updateBusinessInfo = async (req, res) => {
    try {
        const businessInfo = await BusinessInfo.findOneAndUpdate(
            {},
            req.body,
            { new: true, runValidators: true }
        );

        if (!businessInfo) {
            return res.status(404).json({
                success: false,
                message: 'No business information found to update.'
            });
        }

        res.status(200).json({
            success: true,
            data: businessInfo
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


export const getBusinessInfo = async (req, res) => {
    try {
        const businessInfo = await BusinessInfo.findOne();

        if (!businessInfo) {
            return res.status(404).json({
                success: false,
                message: 'No business information found.'
            });
        }

        res.status(200).json({
            success: true,
            data: businessInfo
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

