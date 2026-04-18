import asyncHandler from "../../utils/asyncHandler.js";
import * as svs from '../../services/settings/profileSettings.service.js';

export const getSettings = asyncHandler(async (req, res) => {
    const settings = await svs.getFullSettings(req.user.id);
    res.json({
        success: true,
        settings,
    })
})