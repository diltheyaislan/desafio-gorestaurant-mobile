import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get<Food>(`/foods/${routeParams.id}`);

      setFood({
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      });

      setExtras(
        response.data.extras.map(extra => {
          return {
            ...extra,
            quantity: 0,
          };
        }),
      );
    }

    async function loadFavorite(): Promise<void> {
      try {
        const response = await api.get<Food>(`/favorites/${routeParams.id}`);

        setIsFavorite(true);
      } catch (err) {
        console.log(err);
      }
    }

    loadFood();

    loadFavorite();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(
      extras.map(extra => {
        const extraItem = extra;

        if (extra.id === id) {
          extraItem.quantity += 1;
        }

        return extraItem;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(
      extras.map(extra => {
        const extraItem = extra;

        if (extra.id === id) {
          extraItem.quantity =
            extraItem.quantity === 0 ? 0 : extraItem.quantity - 1;
        }

        return extraItem;
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(foodQuantity === 1 ? 1 : foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      try {
        await api.delete(`/favorites/${routeParams.id}`);
      } catch (err) {
        console.log(err);
      }

      setIsFavorite(false);
    } else {
      try {
        await api.post(`/favorites`, {
          id: food.id,
          name: food.name,
          description: food.description,
          price: food.price.toString(),
          category: food.category,
          image_url: food.image_url,
          thumbnail_url: food.thumbnail_url,
        });

        setIsFavorite(true);
      } catch (err) {
        console.log(err);
      }
    }
  }, [
    isFavorite,
    routeParams.id,
    food.id,
    food.name,
    food.description,
    food.price,
    food.category,
    food.image_url,
    food.thumbnail_url,
  ]);

  const cartTotal = useMemo(() => {
    const totalExtras: number =
      extras.length === 0
        ? 0
        : extras
            .map(extra => extra.quantity * extra.value)
            .reduce((acc, cur) => acc + cur);

    const total = (Number(food.price) + totalExtras) * foodQuantity;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const totalExtras =
      extras.length === 0
        ? 0
        : extras
            .map(extra => extra.quantity * extra.value)
            .reduce((acc, cur) => acc + cur);

    const total = (Number(food.price) + totalExtras) * foodQuantity;

    await api.post('/orders', {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: total,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras,
    });

    navigation.navigate('Orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
