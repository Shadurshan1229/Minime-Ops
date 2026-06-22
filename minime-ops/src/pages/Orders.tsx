import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'

export default function Orders() {
  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track your print jobs"
        action={
          <Button variant="primary">
            <Plus size={16} strokeWidth={1.5} />
            New order
          </Button>
        }
      />
    </div>
  )
}
