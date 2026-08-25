import { sql } from '@/app/lib/db';

export async function GET() {
  try {
    const buses = [
      { id: 'bus-southwest', name: 'Golden Express Southwest', type: 'standard', capacity: 14, amenities: ['Wi-Fi', 'Air conditioning', 'Reclining seats'] },
      { id: 'bus-kumba', name: 'Golden Express Kumba Line', type: 'standard', capacity: 14, amenities: ['USB charging', 'Snacks', 'Reading lights'] },
      { id: 'bus-coastal', name: 'Golden Express Coastal', type: 'luxury', capacity: 14, amenities: ['Restroom', 'Large luggage', 'Climate control'] },
    ];
    for (const bus of buses) {
      await sql`
        INSERT INTO buses (id, name, type, capacity, amenities)
        VALUES (${bus.id}, ${bus.name}, ${bus.type}, ${bus.capacity}, ${sql.json(bus.amenities)})
        ON CONFLICT (id) DO UPDATE SET capacity = EXCLUDED.capacity, amenities = EXCLUDED.amenities, updated_at = now();
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
        price: 1000,
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
      {
        id: 'route-4', origin: 'Buea', destination: 'Limbe', date: sampleDate,
        departure: '11:00 AM', arrival: '01:15 PM', duration: '2h 15m',
        bus_name: 'Golden Express Southwest', price: 1000,
        amenities: ['Wi-Fi', 'Air conditioning', 'Reclining seats'], bus_id: 'bus-southwest',
      },
      {
        id: 'route-5', origin: 'Kumba', destination: 'Douala', date: sampleDate,
        departure: '06:30 AM', arrival: '09:00 AM', duration: '2h 30m',
        bus_name: 'Golden Express Kumba Line', price: 4000,
        amenities: ['USB charging', 'Snacks', 'Reading lights'], bus_id: 'bus-kumba',
      },
      {
        id: 'route-6', origin: 'Douala', destination: 'Kumba', date: sampleDate,
        departure: '03:00 PM', arrival: '05:30 PM', duration: '2h 30m',
        bus_name: 'Golden Express Kumba Line', price: 4000,
        amenities: ['USB charging', 'Snacks', 'Reading lights'], bus_id: 'bus-kumba',
      },
      {
        id: 'route-7', origin: 'Kumba', destination: 'Limbe', date: sampleDate,
        departure: '07:00 AM', arrival: '09:30 AM', duration: '2h 30m',
        bus_name: 'Golden Express Coastal', price: 3000,
        amenities: ['Restroom', 'Large luggage', 'Climate control'], bus_id: 'bus-coastal',
      },
      {
        id: 'route-8', origin: 'Buea', destination: 'Douala', date: sampleDate,
        departure: '08:00 AM', arrival: '01:00 PM', duration: '5h',
        bus_name: 'Golden Express Coastal', price: 25000,
        amenities: ['Restroom', 'Large luggage', 'Climate control'], bus_id: 'bus-coastal',
      },
      {
        id: 'route-9', origin: 'Douala', destination: 'Buea', date: sampleDate,
        departure: '02:00 PM', arrival: '07:00 PM', duration: '5h',
        bus_name: 'Golden Express Coastal', price: 25000,
        amenities: ['Restroom', 'Large luggage', 'Climate control'], bus_id: 'bus-coastal',
      },
    ];

    for (const route of routes) {
      await sql`
        INSERT INTO routes (id, origin, destination)
        VALUES (${route.id}, ${route.origin}, ${route.destination})
        ON CONFLICT (id) DO UPDATE SET origin = EXCLUDED.origin, destination = EXCLUDED.destination, updated_at = now();
      `;
      await sql`
        INSERT INTO schedules (id, route_id, bus_id, travel_date, departure, arrival, duration, price, amenities)
        VALUES (${route.id}, ${route.id}, ${route.bus_id}, ${route.date}, ${route.departure}, ${route.arrival}, ${route.duration}, ${route.price}, ${sql.json(route.amenities)})
        ON CONFLICT (id) DO UPDATE SET bus_id = EXCLUDED.bus_id, travel_date = EXCLUDED.travel_date,
          departure = EXCLUDED.departure, arrival = EXCLUDED.arrival, duration = EXCLUDED.duration,
          price = EXCLUDED.price, amenities = EXCLUDED.amenities, updated_at = now();
      `;

      const seats = Array.from({ length: 14 }, (_, index) => ({
        id: `${Math.floor(index / 4) + 1}${['A', 'B', 'C', 'D'][index % 4]}`,
        available: index !== 4,
      }));

      for (const seat of seats) {
        await sql`
          INSERT INTO seats (id, schedule_id, label, type, available, price)
          VALUES (${seat.id}, ${route.id}, ${seat.id}, ${seat.id.endsWith('A') ? 'window' : 'aisle'}, ${seat.available}, ${route.price})
          ON CONFLICT (schedule_id, id) DO NOTHING;
        `;
      }
    }

    return Response.json({ status: 'seeded' }, { status: 200 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
