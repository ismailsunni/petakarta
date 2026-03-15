import DatasetUpload from './DatasetUpload'
import DatasetList from './DatasetList'
import UserLayersPanel from './UserLayersPanel'

export default function DatasetsTab() {
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div>
        <h3 className="text-sm font-medium mb-2">Upload Dataset</h3>
        <DatasetUpload />
      </div>

      {/* Layers on Map Section */}
      <div>
        <UserLayersPanel />
      </div>

      {/* Datasets Library Section */}
      <div>
        <h3 className="text-sm font-medium mb-2">My Datasets</h3>
        <DatasetList />
      </div>
    </div>
  )
}
