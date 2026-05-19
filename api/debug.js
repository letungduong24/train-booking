const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function test() {
  const fromId = '88196149-5584-4d93-a69e-dd931cf91602';
  const toId = '95eb4dcc-129e-418b-8064-67e88318b101';
  
  const fromStation = await prisma.station.findUnique({ where: { id: fromId } });
  const toStation = await prisma.station.findUnique({ where: { id: toId } });
  console.log('From:', fromStation?.name, fromStation?.code);
  console.log('To:', toStation?.name, toStation?.code);
  
  if(!fromStation || !toStation) return;
  
  const routes = await prisma.route.findMany({
    include: {
      stations: {
        include: { station: true },
        orderBy: { index: 'asc' }
      }
    }
  });
  
  const valid = routes.filter(r => {
    const f = r.stations.find(s => s.station.code === fromStation.code);
    const t = r.stations.find(s => s.station.code === toStation.code);
    return f && t && f.index < t.index;
  });
  
  console.log('Valid routes count:', valid.length);
  
  if(valid.length > 0) {
    const trips = await prisma.trip.findMany({
      where: {
        routeId: { in: valid.map(r => r.id) }
      }
    });
    console.log('Trips count:', trips.length);
    console.log('Trips:', trips.map(t => ({ id: t.id, status: t.status, time: t.departureTime })));
  }
}

test().finally(() => prisma.$disconnect());
