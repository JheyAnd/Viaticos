import sys
from database import SessionLocal
import models

def clear_database():
    print("Iniciando vaciado de la base de datos...")
    db = SessionLocal()
    try:
        # Eliminar en orden de dependencias de clave foránea
        print("Eliminando registros de gastos...")
        num_gastos = db.query(models.Gasto).delete()
        print(f"Se eliminaron {num_gastos} gastos.")
        
        print("Eliminando registros de legalizaciones...")
        num_legs = db.query(models.Legalizacion).delete()
        print(f"Se eliminaron {num_legs} legalizaciones.")
        
        print("Eliminando registros de usuarios...")
        num_users = db.query(models.User).delete()
        print(f"Se eliminaron {num_users} usuarios.")
        
        db.commit()
        print("¡Base de datos vaciada con éxito!")
    except Exception as e:
        db.rollback()
        print(f"Error al vaciar la base de datos: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clear_database()
