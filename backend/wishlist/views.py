from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Wishlist
from .serializers import WishlistSerializer

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def add_to_wishlist(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product_id=product_id
        )

        if created:
            serializer = self.get_serializer(wishlist_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Product already in wishlist'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove_from_wishlist(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wishlist_item = Wishlist.objects.get(user=request.user, product_id=product_id)
            wishlist_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Wishlist.DoesNotExist:
            return Response({'error': 'Product not in wishlist'}, status=status.HTTP_404_NOT_FOUND) 