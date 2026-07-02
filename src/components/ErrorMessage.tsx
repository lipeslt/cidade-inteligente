import { View, Text } from '@tamagui/core';
import { Button } from '@tamagui/button';
import { Card } from '@tamagui/card';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Card exibindo mensagem de erro com botão opcional de tentar novamente.
 * Texto em pt-BR.
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Card
      p="$4"
      m="$3"
      bg="$red2"
      borderWidth={1}
      borderColor="$red6"
      rounded="$4"
    >
      <View gap="$3" items="center">
        <Text color="$red10" fontSize="$4" text="center">
          {message}
        </Text>
        {onRetry ? (
          <Button
            size="$3"
            theme="red"
            onPress={onRetry}
            accessibilityLabel="Tentar novamente"
          >
            Tentar novamente
          </Button>
        ) : null}
      </View>
    </Card>
  );
}
