const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // fallback

async function fix() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in env variables!");
        process.exit(1);
    }
    const client = new MongoClient(uri);
    await client.connect();
    
    // Parse DB name from URI or rely on default
    const db = client.db(); 
    const sittings = db.collection('sittings');
    
    // Unset photographer if it's less than 24 chars (not an ObjectId hex string)
    const badPhotographers = await sittings.updateMany(
        { photographer: { $type: "string", $not: { $regex: /^[0-9a-fA-F]{24}$/ } } },
        { $unset: { photographer: 1 } }
    );
    
    const badEditors = await sittings.updateMany(
        { editor: { $type: "string", $not: { $regex: /^[0-9a-fA-F]{24}$/ } } },
        { $unset: { editor: 1 } }
    );
    
    console.log(`Cleaned bad strings - photographer: ${badPhotographers.modifiedCount}, editor: ${badEditors.modifiedCount}`);
    
    await client.close();
}

fix().catch(console.error);
