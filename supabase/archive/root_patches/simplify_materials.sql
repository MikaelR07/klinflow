DELETE FROM material_prices;
INSERT INTO material_prices (material_name, category, price_per_kg) VALUES
    ('Plastics', 'Recyclables', 15.00),
    ('Metals', 'Recyclables', 30.00),
    ('Paper & Cardboard', 'Recyclables', 5.00),
    ('Glass', 'Recyclables', 5.00),
    ('E-Waste', 'Hazardous', 40.00);
