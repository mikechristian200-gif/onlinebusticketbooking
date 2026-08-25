import { ensureBookingTables, sql } from '@/app/lib/db';

export async function GET() {
  try {
    await ensureBookingTables();

    const buses = [
      { id: 'bus-southwest', name: 'Golden Express Southwest', type: 'standard', capacity: 6, amenities: ['Wi-Fi', 'Air conditioning', 'Reclining seats'] },
      { id: 'bus-kumba', name: 'Golden Express Kumba Line', type: 'standard', capacity: 6, amenities: ['USB charging', 'Snacks', 'Reading lights'] },
      { id: 'bus-coastal', name: 'Golden Express Coastal', type: 'luxury', capacity: 6, amenities: ['Restroom', 'Large luggage', 'Climate control'] },
    ];
    for (const bus of buses) {
      await sql`
        INSERT INTO buses (id, name, type, capacity, amenities)
        VALUES (${bus.id}, ${bus.name}, ${bus.type}, ${bus.capacity}, ${sql.json(bus.amenities)})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    const sampleDate = new Date().toISOString().slice(0, 10);

    const routes = [
      {
        id: 'route-1',
        origin: 'Limbe',
        destination: 'Buea',
        date: sampleDate,
        departure: '08:30 AM',
        arrival: '10:45 AM',
        duration: '2h 15m',
        bus_name: 'Golden Express Southwest',
        price: 4500,
        amenities: ['Wi-Fi', 'Air conditioning', 'Reclining seats'],
        bus_id: 'bus-southwest',
      },
      {
        id: 'route-2',
        origin: 'Kumba',
        destination: 'Buea',
        date: sampleDate,
        departure: '09:15 AM',
        arrival: '11:30 AM',
        duration: '2h 15m',
        bus_name: 'Golden Express Kumba Line',
        price: 5200,
        amenities: ['USB charging', 'Snacks', 'Reading lights'],
        bus_id: 'bus-kumba',
      },
      {
        id: 'route-3',
        origin: 'Douala',
        destination: 'Limbe',
        date: sampleDate,
        departure: '02:00 PM',
        arrival: '05:30 PM',
        duration: '3h 30m',
        bus_name: 'Golden Express Coastal',
        price: 6300,
        amenities: ['Restroom', 'Large luggage', 'Climate control'],
        bus_id: 'bus-coastal',
      },
    ];

    for (const route of routes) {
      await sql`
        INSERT INTO routes (id, bus_id, origin, destination, date, departure, arrival, duration, bus_name, price, amenities)
        VALUES (${route.id}, ${route.bus_id}, ${route.origin}, ${route.destination}, ${route.date}, ${route.departure}, ${route.arrival}, ${route.duration}, ${route.bus_name}, ${route.price}, ${sql.json(route.amenities)})
        ON CONFLICT (id) DO UPDATE SET bus_id = EXCLUDED.bus_id;
      `;

      const seats = [
        { id: '1A', available: true },
        { id: '1B', available: true },
        { id: '2A', available: true },
        { id: '2B', available: true },
        { id: '3A', available: false },
        { id: '3B', available: true },
      ];

      for (const seat of seats) {
        await sql`
          INSERT INTO seats (id, route_id, label, type, available, price)
          VALUES (${seat.id}, ${route.id}, ${seat.id}, ${seat.id.endsWith('A') ? 'window' : 'aisle'}, ${seat.available}, ${route.price})
          ON CONFLICT (id, route_id) DO NOTHING;
        `;
      }
    }

    return Response.json({ status: 'seeded' }, { status: 200 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
