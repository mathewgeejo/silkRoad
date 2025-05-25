app.get("/", async (req, res) => {
  try {
    const { name } = req.query;
    
    if (name) {
      const result = await client.query(`
        SELECT * FROM students 
        WHERE name ILIKE $1
        ORDER BY name
      `, [`%${name}%`]);
      