package com.morphle.scanner_application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Coordinates implements Serializable {

    private double unitX;

    private double unitY;

    @JsonProperty("xCoord")
    private double xCoord;

    @JsonProperty("yCoord")
    private double yCoord;

}
