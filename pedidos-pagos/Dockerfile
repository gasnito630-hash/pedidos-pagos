# Usar imagen de Maven con Java 17
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar pom.xml y descargar dependencias
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Imagen final más ligera
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copiar solo el JAR compilado desde la etapa de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
