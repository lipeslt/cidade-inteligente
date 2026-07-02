import { Button, Image, Text, XStack, YStack } from 'tamagui';
import type { ImageFile } from '@/types';

interface PhotoPickerProps {
  photos: ImageFile[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
}

const THUMBNAIL_SIZE = 80;

/**
 * Grid de thumbnails de fotos com funcionalidade de adicionar/remover.
 * Exibe thumbnails das fotos existentes, botão + para adicionar mais (se abaixo do máximo),
 * e botões X para remover. Mostra mensagem de validação se o limite for atingido.
 */
export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 5,
}: PhotoPickerProps) {
  const isAtMax = photos.length >= maxPhotos;

  return (
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="500" color="$gray11">
        Fotos ({photos.length}/{maxPhotos})
      </Text>

      <XStack gap="$2" flexWrap="wrap">
        {photos.map((photo, index) => (
          <YStack
            key={`${photo.uri}-${index}`}
            width={THUMBNAIL_SIZE}
            height={THUMBNAIL_SIZE}
            borderRadius="$2"
            overflow="hidden"
            position="relative"
          >
            <Image
              source={{ uri: photo.uri }}
              width={THUMBNAIL_SIZE}
              height={THUMBNAIL_SIZE}
              resizeMode="cover"
              accessibilityLabel={`Foto ${index + 1}`}
            />
            <XStack
              position="absolute"
              top={2}
              right={2}
              backgroundColor="rgba(0, 0, 0, 0.6)"
              borderRadius="$4"
              width={22}
              height={22}
              justifyContent="center"
              alignItems="center"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => onRemove(index)}
              cursor="pointer"
              accessibilityRole="button"
              accessibilityLabel={`Remover foto ${index + 1}`}
            >
              <Text color="white" fontSize="$1" fontWeight="700">
                ✕
              </Text>
            </XStack>
          </YStack>
        ))}

        {!isAtMax && (
          <Button
            width={THUMBNAIL_SIZE}
            height={THUMBNAIL_SIZE}
            borderRadius="$2"
            borderWidth={2}
            borderColor="$gray6"
            borderStyle="dashed"
            backgroundColor="$gray2"
            justifyContent="center"
            alignItems="center"
            onPress={onAdd}
            pressStyle={{ opacity: 0.7, backgroundColor: '$gray3' }}
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto"
          >
            <Text fontSize="$7" color="$gray9" lineHeight={32}>
              +
            </Text>
          </Button>
        )}
      </XStack>

      {isAtMax && (
        <Text fontSize="$2" color="$orange10">
          Máximo de {maxPhotos} fotos atingido
        </Text>
      )}
    </YStack>
  );
}
