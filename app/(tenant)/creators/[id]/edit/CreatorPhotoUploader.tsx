'use client'

import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/ImageUploader'
import { Avatar } from '@/components/cocktail/Avatar'
import { updateCreatorPhotoAction } from './photo-actions'

export function CreatorPhotoUploader({
  creatorId,
  creatorName,
  currentUrl,
}: {
  creatorId: string
  creatorName: string
  currentUrl: string | null
}) {
  const router = useRouter()
  return (
    <ImageUploader
      alt={`${creatorName} portrait`}
      aspectRatio="1 / 1"
      currentUrl={currentUrl}
      placeholder={<Avatar name={creatorName} size={96} />}
      onUpload={async (dataUrl) => {
        const res = await updateCreatorPhotoAction({ creatorId, dataUrl })
        if (res.ok) router.refresh()
        return res
      }}
      onRemove={async () => {
        const res = await updateCreatorPhotoAction({ creatorId, dataUrl: null })
        if (res.ok) router.refresh()
        return res
      }}
    />
  )
}
