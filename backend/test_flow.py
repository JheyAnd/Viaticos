import httpx
import sys
from database import SessionLocal
import models
from auth_utils import create_access_token

BASE_URL = "http://localhost:8016"

def test_full_flow():
    client = httpx.Client()
    
    # Configurar usuarios de prueba directamente en la base de datos local
    db = SessionLocal()
    try:
        colab = db.query(models.User).filter(models.User.correo == "test_colab_flow@pcmejia.com.co").first()
        if not colab:
            colab = models.User(
                nombre="Colaborador de Pruebas API",
                correo="test_colab_flow@pcmejia.com.co",
                rol="colaborador"
            )
            db.add(colab)
        else:
            colab.rol = "colaborador"
            colab.nombre = "Colaborador de Pruebas API"
            
        superadmin = db.query(models.User).filter(models.User.correo == "superadmin@pcmejia.com.co").first()
        if not superadmin:
            superadmin = models.User(
                nombre="Superadmin Pruebas",
                correo="superadmin@pcmejia.com.co",
                rol="superadmin"
            )
            db.add(superadmin)
        else:
            superadmin.rol = "superadmin"
            superadmin.nombre = "Superadmin Pruebas"
            
        db.commit()
        db.refresh(colab)
        db.refresh(superadmin)
    finally:
        db.close()

    colab_token = create_access_token(data={"sub": "test_colab_flow@pcmejia.com.co"})
    admin_token = create_access_token(data={"sub": "superadmin@pcmejia.com.co"})
    
    # 1. Register a new collaborator
    print("1. Registering new collaborator...")
    print("   Success: Collaborator registered (Direct DB entry).")

    # 2. Login as collaborator
    print("\n2. Logging in as collaborator...")
    print("   Success: Collaborator logged in. Token acquired locally.")

    # 3. Create legalisation
    print("\n3. Creating legalisation draft...")
    headers = {"Authorization": f"Bearer {colab_token}"}
    leg_payload = {
        "destino_motivo": "Bogotá - Reunión de Pruebas",
        "anticipo": 150000,
        "fecha_inicio": "2026-07-08"
    }
    resp = client.post(f"{BASE_URL}/api/legalizaciones", json=leg_payload, headers=headers)
    assert resp.status_code == 201, f"Failed to create legalisation: {resp.text}"
    leg = resp.json()
    leg_id = leg["id"]
    assert leg["estado"] == "Borrador"
    assert float(leg["anticipo"]) == 150000.0
    print(f"   Success: Legalisation draft #{leg_id} created in 'Borrador' state.")

    # 4. Add expense to draft
    print("\n4. Adding expense to draft...")
    # Add expense using multipart/form-data
    files = {"comprobante": ("test.txt", b"dummy receipt file content", "text/plain")}
    data = {
        "descripcion": "Cena de trabajo",
        "categoria": "Alimentacion",
        "monto": 35000,
        "fecha_gasto": "2026-07-08"
    }
    resp = client.post(f"{BASE_URL}/api/legalizaciones/{leg_id}/gastos", data=data, files=files, headers=headers)
    assert resp.status_code == 201, f"Failed to add expense: {resp.text}"
    gasto = resp.json()
    print(f"   Success: Expense added. ID={gasto['id']}, Monto={gasto['monto']}, Categoria={gasto['categoria']}.")

    # 5. Submit legalisation
    print("\n5. Submitting legalisation for approval...")
    update_payload = {"estado": "Enviado"}
    resp = client.put(f"{BASE_URL}/api/legalizaciones/{leg_id}", json=update_payload, headers=headers)
    assert resp.status_code == 200, f"Failed to submit: {resp.text}"
    leg = resp.json()
    assert leg["estado"] == "Enviado"
    print("   Success: Legalisation state updated to 'Enviado'.")

    # 6. Verify collaborator cannot delete or edit it anymore
    print("\n6. Verifying collaborator cannot delete 'Enviado' legalisation...")
    resp = client.delete(f"{BASE_URL}/api/legalizaciones/{leg_id}", headers=headers)
    assert resp.status_code == 400, f"Collaborator should not be able to delete: {resp.text}"
    print("   Success: Collaborator delete blocked with 400 Bad Request.")

    # 7. Log in as superadmin
    print("\n7. Logging in as Superadmin...")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   Success: Superadmin logged in.")

    # 8. List all legalisations as Admin, check if new legalisation is present with collaborator's info
    print("\n8. Listing legalisations as Admin...")
    resp = client.get(f"{BASE_URL}/api/legalizaciones", headers=admin_headers)
    assert resp.status_code == 200
    legs = resp.json()
    found = [l for l in legs if l["id"] == leg_id]
    assert len(found) > 0, "Our test legalisation was not returned in the global list."
    test_leg = found[0]
    assert test_leg["usuario"] is not None, "User relation object 'usuario' is missing in response."
    assert test_leg["usuario"]["correo"] == "test_colab_flow@pcmejia.com.co"
    print("   Success: Legalisation found in global list. Collaborator name/email are present.")

    # 9. Get detailed legalisation as Admin
    print("\n9. Getting detailed legalisation as Admin...")
    resp = client.get(f"{BASE_URL}/api/legalizaciones/{leg_id}", headers=admin_headers)
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["usuario"] is not None
    assert detail["usuario"]["nombre"] == "Colaborador de Pruebas API"
    print("   Success: Detailed response includes user relation.")

    # 10. Reject legalisation (back to Borrador) as Admin
    print("\n10. Rejecting legalisation (state -> Borrador) as Admin...")
    reject_payload = {"estado": "Borrador"}
    resp = client.put(f"{BASE_URL}/api/legalizaciones/{leg_id}", json=reject_payload, headers=admin_headers)
    assert resp.status_code == 200
    leg = resp.json()
    assert leg["estado"] == "Borrador"
    print("    Success: Admin successfully returned the legalisation to 'Borrador'.")

    # 11. Resubmit as collaborator
    print("\n11. Resubmitting as collaborator...")
    resp = client.put(f"{BASE_URL}/api/legalizaciones/{leg_id}", json=update_payload, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["estado"] == "Enviado"
    print("    Success: Collaborator resubmitted successfully.")

    # 12. Approve and Finalize as Admin
    print("\n12. Approving and Finalizing as Admin...")
    approve_payload = {"estado": "Finalizado"}
    resp = client.put(f"{BASE_URL}/api/legalizaciones/{leg_id}", json=approve_payload, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["estado"] == "Finalizado"
    print("    Success: Admin approved and finalized the legalisation.")

    # 13. Superadmin lists all users
    print("\n13. Listing users as Superadmin...")
    resp = client.get(f"{BASE_URL}/api/auth/users", headers=admin_headers)
    assert resp.status_code == 200
    users = resp.json()
    user_to_promote = [u for u in users if u["correo"] == "test_colab_flow@pcmejia.com.co"][0]
    user_id_to_promote = user_to_promote["id"]
    print(f"    Success: Users listed. Found user ID={user_id_to_promote} for promotion.")

    # 14. Superadmin promotes collaborator to admin role
    print("\n14. Promoting collaborator to Admin role...")
    role_payload = {"rol": "admin"}
    resp = client.put(f"{BASE_URL}/api/auth/users/{user_id_to_promote}/role", json=role_payload, headers=admin_headers)
    assert resp.status_code == 200
    updated_user = resp.json()
    assert updated_user["rol"] == "admin"
    print("    Success: User promoted to 'admin'.")

    # 15. Verify new Admin can list all legalisations
    print("\n15. Logging in as new Admin to check permissions...")
    new_admin_headers = {"Authorization": f"Bearer {colab_token}"} # Token of same user (who is now admin)
    # Note: token claims might use "sub" (email) so it queries dynamically. Let's verify by calling /api/auth/me first.
    resp = client.get(f"{BASE_URL}/api/auth/me", headers=new_admin_headers)
    assert resp.status_code == 200
    assert resp.json()["rol"] == "admin", "Token user role did not update in session."
    
    resp = client.get(f"{BASE_URL}/api/legalizaciones", headers=new_admin_headers)
    assert resp.status_code == 200
    print("    Success: New Admin successfully fetched global legalisations list.")
    
    # 16. Verify new Admin cannot access user list
    print("\n16. Verifying new Admin cannot access user list...")
    resp = client.get(f"{BASE_URL}/api/auth/users", headers=new_admin_headers)
    assert resp.status_code == 403
    print("    Success: Access to user list blocked with 403 Forbidden for normal admin.")

    # 17. Verify Admin can delete legalisation
    print("\n17. Verifying Admin can delete legalisation...")
    resp = client.delete(f"{BASE_URL}/api/legalizaciones/{leg_id}", headers=new_admin_headers)
    assert resp.status_code == 204
    print("    Success: Admin deleted legalisation successfully with 204 No Content.")

    # 18. Verify Superadmin delete returns 404 for already deleted legalisation
    print("\n18. Verifying Superadmin delete returns 404...")
    resp = client.delete(f"{BASE_URL}/api/legalizaciones/{leg_id}", headers=admin_headers)
    assert resp.status_code == 404
    print("    Success: Already deleted legalisation returned 404 Not Found.")

    # 19. Verify user deletion leaves legalisations intact (ondelete="SET NULL")
    print("\n19. Verifying user deletion sets legalisation.usuario_id to NULL...")
    
    db = SessionLocal()
    temp_user = db.query(models.User).filter(models.User.correo == "temp_delete_test@pcmejia.com.co").first()
    if temp_user:
        db.delete(temp_user)
        db.commit()
    temp_user = models.User(
        nombre="Temp User Delete Test",
        correo="temp_delete_test@pcmejia.com.co",
        rol="colaborador"
    )
    db.add(temp_user)
    db.commit()
    db.refresh(temp_user)
    temp_user_id = temp_user.id
    db.close()

    temp_user_token = create_access_token(data={"sub": "temp_delete_test@pcmejia.com.co"})
    temp_headers = {"Authorization": f"Bearer {temp_user_token}"}
    temp_leg_payload = {
        "destino_motivo": "Medellín - Test Delete Cascading",
        "anticipo": 100000,
        "fecha_inicio": "2026-07-08"
    }
    resp = client.post(f"{BASE_URL}/api/legalizaciones", json=temp_leg_payload, headers=temp_headers)
    assert resp.status_code == 201
    temp_leg_id = resp.json()["id"]

    resp = client.delete(f"{BASE_URL}/api/auth/users/{temp_user_id}", headers=admin_headers)
    assert resp.status_code == 204

    resp = client.get(f"{BASE_URL}/api/legalizaciones/{temp_leg_id}", headers=admin_headers)
    assert resp.status_code == 200
    leg_after = resp.json()
    assert leg_after["usuario_id"] is None
    assert leg_after["usuario"] is None
    print("    Success: User deleted but legalisation remains with usuario_id = NULL.")

    resp = client.delete(f"{BASE_URL}/api/legalizaciones/{temp_leg_id}", headers=admin_headers)
    assert resp.status_code == 204
    print("    Success: Cleaned up temp legalisation.")

    print("\nALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_flow()
