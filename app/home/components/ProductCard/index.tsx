import { DisplayProduct } from '@/types' // 1. Importar o tipo
import styles from './styles.module.css'

interface ProductCardProps {
  product: DisplayProduct // 2. Usar o novo tipo
  onProductClick: (product: DisplayProduct) => void
}

export default function ProductCard({ product, onProductClick }: ProductCardProps) {
  
  // 3. Fallback para imagem (caso image_url seja null)
  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' // Imagem placeholder

  return (
    <div className={styles.productCard} onClick={() => onProductClick(product)}>
      <div className={styles.productImageWrapper}>
        <img
          src={imageUrl}
          alt={product.name}
          className={styles.productImage}
          width={100}
          height={100}
        />
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        {product.description && (
           <p className={styles.productDescription}>{product.description}</p>
        )}
        <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
      </div>
    </div>
  )
}