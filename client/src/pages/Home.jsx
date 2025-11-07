import { Link } from 'react-router-dom';
import QuotationTable from '../components/QuotationTable';

export default function Home() {
  return (
    <div>
      {/* <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gold">Quotations</h1>
        <Link to="/create" className="btn-primary">
          + Create New
        </Link>
      </div> */}
      <QuotationTable />
    </div>
  );
}