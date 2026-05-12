import { getMyAssignments } from './lib/actions/employee'

async function debug() {
  const assignments = await getMyAssignments()
  console.log('Assignments:', JSON.stringify(assignments, null, 2))
}

debug()
