const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth.middleware.js");

router.get("/nearby", auth, async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                message: "Latitude and longitude are required",
            });
        }
        const keywords = [
            "doctor",
            "clinic",
            "medical clinic",
            "physician",
            "hospital",
        ];
        const requests = keywords.map((keyword) => {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=15000&keyword=${encodeURIComponent(
                keyword
            )}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

            return axios.get(url);
        });

        const responses = await Promise.all(requests);
        // Merge all results and remove duplicates using place_id
        const placesMap = new Map();

        responses.forEach((response) => {
            response.data.results.forEach((place) => {
                if (!placesMap.has(place.place_id)) {
                    placesMap.set(place.place_id, {
                        name: place.name,
                        address: place.vicinity,
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                        rating: place.rating || null,
                        open_now: place.opening_hours?.open_now ?? null,
                        place_id: place.place_id,
                        types: place.types,
                    });
                }
            });
        });

        const clinics = Array.from(placesMap.values()).slice(0, 50);

        res.json({
            count: clinics.length,
            results: clinics,
        });
    } catch (error) {
        console.error("Google Maps API Error:", error.response?.data || error.message);

        res.status(500).json({
            message: "Failed to fetch nearby doctors and clinics",
        });
    }
});

module.exports = router;